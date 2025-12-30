"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Eye, Download } from "lucide-react";

/* ================= TYPES ================= */
interface Department {
  id: string;
  name: string;
}

type DocumentType = "SD" | "WORK_ORDER" | "TENDER";

interface SiteDocument {
  id: string;
  type: DocumentType;
  secureUrl: string;
  originalName?: string | null;
}

/* ================= COMPONENT ================= */
export default function EditSiteForm({ siteId }: { siteId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  /* ================= BASIC ================= */
  const [siteName, setSiteName] = useState("");
  const [tenderNo, setTenderNo] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [sdAmount, setSdAmount] = useState("");

  /* ================= FILES ================= */
  const [sdFile, setSdFile] = useState<File | null>(null);
  const [workOrderFile, setWorkOrderFile] = useState<File | null>(null);
  const [tenderDocs, setTenderDocs] = useState<File[]>([]);
  const [existingDocs, setExistingDocs] = useState<SiteDocument[]>([]);

  /* ================= FILE REFS ================= */
  const sdFileRef = useRef<HTMLInputElement>(null);
  const workOrderFileRef = useRef<HTMLInputElement>(null);
  const tenderDocsRef = useRef<HTMLInputElement>(null);

  /* ================= ESTIMATE ================= */
  const [estimate, setEstimate] = useState<Record<string, string>>({});

  /* ================= DEPARTMENT ================= */
  const [departments, setDepartments] = useState<Department[]>([]);

  /* ================= UX ================= */
  const [loading, setLoading] = useState(false);

  /* ================= API (SAFE) ================= */
  const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

  const SITE_API = `${BASE_URL}/api/sites`;
  const DEPT_API = `${BASE_URL}/api/departments`;

  /* ================= LOAD DEPARTMENTS ================= */
  const loadDepartments = async () => {
    try {
      const res = await fetch(DEPT_API);
      if (!res.ok) throw new Error("Department fetch failed");

      const json = await res.json();
      setDepartments(json?.data ?? []);
    } catch {
      toast({ title: "❌ Failed to load departments" });
    }
  };

  /* ================= LOAD SITE ================= */
  const loadSite = async () => {
    try {
      const res = await fetch(`${SITE_API}/${siteId}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Fetch failed");
      }

      const data = json.data ?? json;

      // BASIC
      setSiteName(data.siteName || "");
      setTenderNo(data.tenderNo || "");
      setSdAmount(data.sdAmount ? String(data.sdAmount) : "");

      // DEPARTMENT
      setDepartmentId(data.department?.id || "");

      // ESTIMATES
      if (data.estimates) {
        setEstimate({
          Cement: String(data.estimates.cement ?? ""),
          Metal: String(data.estimates.metal ?? ""),
          Sand: String(data.estimates.sand ?? ""),
          Labour: String(data.estimates.labour ?? ""),
          Royalty: String(data.estimates.royalty ?? ""),
          "Over Head": String(data.estimates.overhead ?? ""),
          Lead: String(data.estimates.lead ?? ""),
          Dressing: String(data.estimates.dressing ?? ""),
          "Water & Compaction": String(data.estimates.waterCompaction ?? ""),
          Loading: String(data.estimates.loading ?? ""),
        });
      } else {
        setEstimate({});
      }

      /* DOCUMENTS (handle both backend shapes) */
      const docs: SiteDocument[] = [];

      if (data.sdFile) docs.push(data.sdFile);
      if (data.workOrderFile) docs.push(data.workOrderFile);
      if (data.tenderDocs?.length) docs.push(...data.tenderDocs);

      if (!docs.length && Array.isArray(data.documents)) {
        docs.push(...data.documents);
      }

      setExistingDocs(docs);
    } catch (err) {
      console.error("EditSite load error:", err);
      toast({ title: "❌ Failed to load site data" });
    }
  };

  useEffect(() => {
    if (siteId) {
      loadDepartments();
      loadSite();
    }
  }, [siteId]);

  /* ================= HELPERS ================= */
  const handleEstimateChange = (k: string, v: string) => {
    setEstimate(prev => ({ ...prev, [k]: v }));
  };

  const getDownloadUrl = (url: string) =>
    url.includes("/upload/")
      ? url.replace("/upload/", "/upload/fl_attachment/")
      : url;

  const buildFormData = () => {
    const fd = new FormData();

    fd.append("siteName", siteName);
    fd.append("tenderNo", tenderNo);
    fd.append("sdAmount", sdAmount);
    if (departmentId) fd.append("departmentId", departmentId);

    fd.append("cement", estimate["Cement"] || "");
    fd.append("metal", estimate["Metal"] || "");
    fd.append("sand", estimate["Sand"] || "");
    fd.append("labour", estimate["Labour"] || "");
    fd.append("royalty", estimate["Royalty"] || "");
    fd.append("overhead", estimate["Over Head"] || "");
    fd.append("lead", estimate["Lead"] || "");
    fd.append("dressing", estimate["Dressing"] || "");
    fd.append("waterCompaction", estimate["Water & Compaction"] || "");
    fd.append("loading", estimate["Loading"] || "");

    if (sdFile) fd.append("sdFile", sdFile);
    if (workOrderFile) fd.append("workOrderFile", workOrderFile);
    tenderDocs.forEach(f => fd.append("tenderDocs", f));

    return fd;
  };

  /* ================= UPDATE ================= */
  const handleUpdate = async () => {
    if (!siteName) {
      toast({ title: "❌ Site Name is required" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${SITE_API}/${siteId}`, {
        method: "PUT",
        body: buildFormData(),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Update failed");

      toast({ title: "✅ Site Updated Successfully" });
      router.push("/en/all-site-list");
    } catch (e: any) {
      toast({ title: "❌ Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <Card className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold">Edit Site</h2>

      {/* BASIC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <Label>Site Name</Label>
          <Input value={siteName} onChange={e => setSiteName(e.target.value)} />
        </div>

        <div>
          <Label>Tender No</Label>
          <Input value={tenderNo} onChange={e => setTenderNo(e.target.value)} />
        </div>

        <div>
          <Label>Department</Label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={departmentId}
            onChange={e => setDepartmentId(e.target.value)}
          >
            <option value="">Select</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FILES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <Label>SD Amount</Label>
          <Input value={sdAmount} onChange={e => setSdAmount(e.target.value)} />
        </div>

        <div>
          <Label>Replace SD</Label>
          <Input
            ref={sdFileRef}
            type="file"
            onChange={e => setSdFile(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <Label>Replace Work Order</Label>
          <Input
            ref={workOrderFileRef}
            type="file"
            onChange={e => setWorkOrderFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      {/* EXISTING DOCS */}
      {existingDocs.length > 0 && (
        <div className="space-y-2">
          <Label>Existing Documents</Label>
          {existingDocs.map(doc => (
            <div key={doc.id} className="flex items-center gap-3">
              <span className="text-sm">
                {doc.originalName || doc.type}
              </span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => window.open(doc.secureUrl, "_blank")}
              >
                <Eye size={16} />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() =>
                  window.open(getDownloadUrl(doc.secureUrl), "_blank")
                }
              >
                <Download size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div>
        <Label>Add More Tender Documents</Label>
        <Input
          ref={tenderDocsRef}
          type="file"
          multiple
          onChange={e => setTenderDocs(Array.from(e.target.files || []))}
        />
      </div>

      {/* ESTIMATE */}
      <h3 className="text-xl font-semibold">Estimate</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          "Cement",
          "Metal",
          "Sand",
          "Labour",
          "Royalty",
          "Over Head",
          "Lead",
          "Dressing",
          "Water & Compaction",
          "Loading",
        ].map(item => (
          <Input
            key={item}
            placeholder={item}
            value={estimate[item] || ""}
            onChange={e => handleEstimateChange(item, e.target.value)}
          />
        ))}
      </div>

      {/* ACTIONS */}
      <div className="flex justify-center gap-4">
        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? "Updating..." : "Update"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/en/all-site-list")}
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
}
