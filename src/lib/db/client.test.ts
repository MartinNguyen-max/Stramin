import { describe, expect, test, vi } from "vitest";
import { isConnectionError, retryOnConnectionError } from "./client";

describe("retryOnConnectionError", () => {
  test("recognizes broken connections, also when wrapped", () => {
    expect(isConnectionError({ code: "CONNECTION_CLOSED" })).toBe(true);
    expect(
      isConnectionError(new Error("x", { cause: { code: "ECONNRESET" } })),
    ).toBe(true);
    expect(isConnectionError({ code: "42P01" })).toBe(false);
    expect(isConnectionError(undefined)).toBe(false);
  });

  test("tries once more after a connection error", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: "CONNECTION_CLOSED" })
      .mockResolvedValueOnce("ok");
    await expect(retryOnConnectionError(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("doesn't retry real query errors", async () => {
    const fn = vi.fn().mockRejectedValue({ code: "42P01" });
    await expect(retryOnConnectionError(fn)).rejects.toEqual({ code: "42P01" });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
