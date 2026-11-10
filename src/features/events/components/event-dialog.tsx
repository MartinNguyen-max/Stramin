"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { deleteEvent, saveEvent } from "../actions";
import { ACCEPTED_IMAGE_TYPES, uploadEventImage } from "../image";
import type { EventFormState } from "../schemas";
import { EVENT_TYPES, type EventView, MAX_EVENT_TITLE } from "../types";

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
              // biome-ignore lint/performance/noImgElement: a local preview (blob URL) or a short-lived signed URL.
              <img
                src={preview}
                alt=""
                className="h-32 w-full rounded-xl object-cover"
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
