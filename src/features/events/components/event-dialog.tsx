"use client";

import { ImagePlus, Move, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { deleteEvent, saveEvent } from "../actions";
import type { EventFormState } from "../schemas";
import {
  ACCEPTED_IMAGE_TYPES,
  EVENT_TYPES,
  type EventView,
  MAX_EVENT_TITLE,
} from "../types";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const idle: EventFormState = { status: "idle" };

/** Add or edit an event (EVT-1, EVT-2, EVT-4). */
export function EventDialog({
  event,
  userId,
  today,
  onClose,
}: {
  /** Null for a new event. */
  event: EventView | null;
  userId: string;
  today: string;
  onClose: () => void;
}) {
  const t = useTranslations("Events");
  const tCommon = useTranslations("Common");
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [position, setPosition] = useState({
    x: event?.imageX ?? 50,
    y: event?.imageY ?? 50,
  });

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const [state, saveAction, saving] = useActionState(
    async (prev: EventFormState, formData: FormData) => {
      let imagePath = removeImage ? "" : (event?.imagePath ?? "");
      if (file) {
        try {
          // Loaded only when an image is uploaded: it brings the Supabase client (~300 KB), which
          // every page would otherwise download (performance, 2026-11-12).
          const { uploadEventImage } = await import("../image");
          imagePath = await uploadEventImage(file, userId);
        } catch (error) {
          console.warn("[events] image upload failed", error);
          return { status: "error", error: "imageUpload" } as const;
        }
      }
      formData.set("imagePath", imagePath);
      const result = await saveEvent(prev, formData);
      if (result.status === "saved") onClose();
      return result;
    },
    idle,
  );

  const [deleteState, removeAction, deleting] = useActionState(
    async (prev: EventFormState, formData: FormData) => {
      const result = await deleteEvent(prev, formData);
      if (result.status === "saved") onClose();
      return result;
    },
    idle,
  );

  const error =
    state.status === "error"
      ? state.error
      : deleteState.status === "error"
        ? deleteState.error
        : null;
  const preview = filePreview ?? (removeImage ? null : event?.imageUrl);
  const busy = saving || deleting;

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent closeLabel={tCommon("close")}>
        <DialogTitle>{event ? t("editTitle") : t("addTitle")}</DialogTitle>

        <form action={saveAction} className="flex flex-col gap-4">
          {event && <input type="hidden" name="id" value={event.id} />}
          <input type="hidden" name="imageX" value={position.x} />
          <input type="hidden" name="imageY" value={position.y} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-title">{t("fields.title")}</Label>
            <Input
              id="event-title"
              name="title"
              required
              maxLength={MAX_EVENT_TITLE}
              defaultValue={event?.title}
              placeholder={t("fields.titlePlaceholder")}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-date">{t("fields.date")}</Label>
              <Input
                id="event-date"
                name="date"
                type="date"
                required
                min={event ? undefined : today}
                defaultValue={event?.date}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-type">{t("fields.type")}</Label>
              <select
                id="event-type"
                name="type"
                defaultValue={event?.type ?? "triathlon"}
                className={selectClass}
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t("fields.image")}</span>
            {preview && (
              <ImagePositioner
                src={preview}
                position={position}
                onChange={setPosition}
                hint={t("moveImage")}
              />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                <ImagePlus className="size-4" />
                {preview ? t("changeImage") : t("addImage")}
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  className="sr-only"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setRemoveImage(false);
                    setPosition({ x: 50, y: 50 });
                  }}
                />
              </label>
              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setRemoveImage(true);
                  }}
                >
                  {t("removeImage")}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("imageHint")}</p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {t(`errors.${error}`)}
            </p>
          )}

          {busy ? (
            <ZoneSpinner
              size={40}
              label={t("saving")}
              className="self-center"
            />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button type="submit" size="lg">
                {t("save")}
              </Button>
              {event && (
                <Button
                  type={confirmDelete ? "submit" : "button"}
                  variant="destructive"
                  size="lg"
                  formAction={confirmDelete ? removeAction : undefined}
                  onClick={
                    confirmDelete ? undefined : () => setConfirmDelete(true)
                  }
                >
                  <Trash2 />
                  {confirmDelete ? t("confirmDelete") : t("delete")}
                </Button>
              )}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The image as it will look on the card (the card's 16:9 shape): drag it to choose which part shows
 * (owner feedback 2026-11-12). Arrow keys move it too.
 */
function ImagePositioner({
  src,
  position,
  onChange,
  hint,
}: {
  src: string;
  position: { x: number; y: number };
  onChange: (position: { x: number; y: number }) => void;
  hint: string;
}) {
  const drag = useRef<{ x: number; y: number; start: typeof position } | null>(
    null,
  );
  const clamp = (value: number) =>
    Math.round(Math.min(100, Math.max(0, value)));
  const move = (dx: number, dy: number, start = position) =>
    onChange({ x: clamp(start.x - dx), y: clamp(start.y - dy) });

  return (
    <div className="flex flex-col gap-1">
      <div
        role="slider"
        tabIndex={0}
        aria-label={hint}
        aria-valuetext={`${position.x}% ${position.y}%`}
        aria-valuenow={position.y}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative aspect-video w-full max-w-64 cursor-grab touch-none overflow-hidden rounded-2xl bg-black outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, start: position };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const box = e.currentTarget.getBoundingClientRect();
          // Dragging the image right shows more of its left side, so the position goes down.
          move(
            ((e.clientX - drag.current.x) / box.width) * 100,
            ((e.clientY - drag.current.y) / box.height) * 100,
            drag.current.start,
          );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onKeyDown={(e) => {
          const step = 5;
          const keys: Record<string, [number, number]> = {
            ArrowLeft: [step, 0],
            ArrowRight: [-step, 0],
            ArrowUp: [0, step],
            ArrowDown: [0, -step],
          };
          const delta = keys[e.key];
          if (!delta) return;
          e.preventDefault();
          move(delta[0], delta[1]);
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: a local preview (blob URL) or a short-lived signed URL. */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none size-full object-cover opacity-80"
          style={{ objectPosition: `${position.x}% ${position.y}%` }}
        />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/45 py-1 text-[11px] font-medium text-white">
          <Move className="size-3" />
          {hint}
        </span>
      </div>
    </div>
  );
}
