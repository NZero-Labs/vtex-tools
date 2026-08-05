"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { deleteUser } from "@/modules/admin/actions";

const REQUIRED_TEXT = "excluir";

export function DeleteUserDialog({ userId, userName }: { userId: string; userName: string }) {
  const [typed, setTyped] = useState("");
  const confirmed = typed.trim().toLowerCase() === REQUIRED_TEXT;

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm">Excluir</Button>} />
      <AlertDialogContent size="sm">
        <form action={deleteUser}>
          <input type="hidden" name="userId" value={userId} />
          <AlertDialogHeader>
            <AlertDialogMedia className="mb-3 bg-destructive/10 text-destructive">
              <Trash2 aria-hidden />
            </AlertDialogMedia>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir <strong>{userName}</strong>? Esta ação é
              irreversível e removerá todos os dados associados. Digite{" "}
              <strong>excluir</strong> para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
            <Field className="gap-1.5">
              <FieldLabel htmlFor={`confirm-delete-${userId}`}>Confirmação</FieldLabel>
              <Input
                id={`confirm-delete-${userId}`}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={REQUIRED_TEXT}
                autoComplete="off"
                aria-describedby={`confirm-delete-hint-${userId}`}
                className="h-11"
              />
              <FieldDescription id={`confirm-delete-hint-${userId}`}>
                Digite {REQUIRED_TEXT} para habilitar a exclusão.
              </FieldDescription>
            </Field>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={!confirmed}>
              Excluir usuário
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
