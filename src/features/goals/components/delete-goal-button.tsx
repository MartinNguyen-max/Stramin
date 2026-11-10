"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteGoal, type GoalFormState } from "../actions";

/** Delete with a second tap to confirm. */
export function DeleteGoalButton({ id }: { id: string }) {
  const t = useTranslations("Goals.card");
  const [confirm, setConfirm] = useState(false);
  const [, action, pending] = useActionState<GoalFormState, FormData>(
    deleteGoal,
    { status: "idle" },
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button
        type={confirm ? "submit" : "button"}
        variant={confirm ? "destructive" : "ghost"}
        size="sm"
        disabled={pending}
        onClick={confirm ? undefined : () => setConfirm(true)}
        onBlur={() => setConfirm(false)}
      >
        <Trash2 />
        {confirm ? t("confirmDelete") : t("delete")}
      </Button>
    </form>
  );
}
