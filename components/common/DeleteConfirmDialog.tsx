"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

/* ================= PROPS ================= */
interface DeleteConfirmDialogProps {
  open: boolean;

  /** Main heading */
  title?: string;

  /** Description / warning text */
  description?: string;

  /** Confirm button text */
  confirmText?: string;

  /** Cancel button text */
  cancelText?: string;

  /** Loading state (API call time) */
  loading?: boolean;

  /** Called when user clicks Cancel / closes dialog */
  onCancel: () => void;

  /** Called when user confirms delete */
  onConfirm: () => void;
}

/* ================= COMPONENT ================= */
export default function DeleteConfirmDialog({
  open,
  title = "Confirm Delete",
  description = "This record will be permanently deleted from database. This action cannot be undone.",
  confirmText = "Yes, Delete Permanently",
  cancelText = "Cancel",
  loading = false,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>

          {/* ✅ destructive intent */}
          <Button variant="soft" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
