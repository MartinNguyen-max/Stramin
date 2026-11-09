import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "./page";

// Smoke test: proves the Vitest setup works. Replaced when the landing page is built.
test("renders a main heading", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
});
