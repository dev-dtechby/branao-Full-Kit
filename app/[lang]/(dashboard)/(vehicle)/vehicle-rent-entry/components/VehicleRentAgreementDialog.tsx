"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Pencil, ExternalLink, Loader2 } from "lucide-react";
import { API } from "./vehicle-rent.api";

type AgreementInfo = {
  agreementUrl?: string | null;
  agreementName?: string | null;
};

export default function VehicleRentAgreementDialog({
  open,
  onClose,
  vehicleId,
  onUploaded,
  onEditVehicle, // ✅ optional hook
}: {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  onUploaded?: () => void;
  onEditVehicle?: (vehicleId: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [info, setInfo] = useState<AgreementInfo | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasAgreement = useMemo(() => !!info?.agreementUrl, [info]);

  const loadInfo = async () => {
    if (!vehicleId) return;
    try {
      setLoadingInfo(true);

      // ✅ If your backend doesn't have this, tell me — we'll skip and rely on vehicles list refresh
      const res = await fetch(API.agreement(vehicleId), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to load agreement");

      // supports {data:{agreementUrl,agreementName}} OR {data:{vehicle:{...}}}
      const d = json?.data || {};
      const agreementUrl = d.agreementUrl ?? d?.vehicle?.agreementUrl ?? null;
      const agreementName = d.agreementName ?? d?.vehicle?.agreementName ?? null;

      setInfo({ agreementUrl, agreementName });
    } catch (e) {
      // Silent fallback (still allow upload)
      setInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setConfirmDelete(false);
    loadInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicleId]);

  const upload = async () => {
    if (!vehicleId || !file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(API.agreement(vehicleId), {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Upload failed");

      await loadInfo(); // refresh current agreement display
      onUploaded?.();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteAgreement = async () => {
    if (!vehicleId) return;
    try {
      setDeleting(true);

      // ✅ Requires backend DELETE route
      const res = await fetch(API.agreement(vehicleId), {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Delete failed");

      setInfo({ agreementUrl: null, agreementName: null });
      onUploaded?.();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      {/* ✅ Layout safe (no popup overflow issues) */}
      <DialogContent className="sm:max-w-[720px] !p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Agreement</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col min-h-0">
          <div className="p-4 space-y-3 overflow-auto">
            <Card className="p-4 space-y-3">
              {/* Existing agreement info */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Current Agreement</div>

                  {loadingInfo ? (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </div>
                  ) : hasAgreement ? (
                    <div className="mt-1 space-y-1">
                      <div className="text-xs text-muted-foreground truncate">
                        {info?.agreementName || "Agreement"}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={String(info?.agreementUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs underline inline-flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mt-1">No agreement uploaded</div>
                  )}
                </div>

                {/* Optional vehicle edit hook */}
                {onEditVehicle ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={() => onEditVehicle(vehicleId)}
                  >
                    <Pencil className="h-4 w-4" /> Edit Vehicle
                  </Button>
                ) : null}
              </div>

              <div className="h-px bg-border" />

              {/* Upload / Replace */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">
                  {hasAgreement ? "Replace Agreement" : "Upload Agreement"}
                </div>

                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                <div className="flex flex-wrap gap-2 justify-end">
                  {/* Delete Agreement */}
                  {hasAgreement ? (
                    <Button
                      variant="outline"
                      onClick={() => setConfirmDelete(true)}
                      disabled={uploading || deleting}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  ) : null}

                  {/* Upload */}
                  <Button onClick={upload} disabled={!file || uploading || deleting} className="gap-2">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : hasAgreement ? "Replace" : "Upload"}
                  </Button>
                </div>

                {/* Confirm Delete UI */}
                {confirmDelete ? (
                  <div className="mt-2 rounded-lg border p-3 bg-background/30">
                    <div className="text-sm font-medium">Delete agreement?</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      This will remove the agreement link permanently.
                    </div>
                    <div className="flex gap-2 justify-end mt-3">
                      <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                        Cancel
                      </Button>
                      <Button variant="soft" onClick={deleteAgreement} disabled={deleting} className="gap-2">
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        {deleting ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-background/60 backdrop-blur flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={uploading || deleting}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
