"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus, X } from "lucide-react";

/* ================= TYPES ================= */
interface Department {
  id: string;
  name: string;
}

/* ================= COMPONENT ================= */
export default function SiteForm() {
  /* ================= BASIC ================= */
  const [siteName, setSiteName] = useState("");
  const [tenderNo, setTenderNo] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [sdAmount, setSdAmount] = useState("");

  /* ================= FILE STATES ================= */
  const [sdFile, setSdFile] = useState<File | null>(null);
  const [workOrderFile, setWorkOrderFile] = useState<File | null>(null);
  const [tenderDocs, setTenderDocs] = useState<File[]>([]);

  /* ================= FILE REFS (IMPORTANT) ================= */
  const sdFileRef = useRef<HTMLInputElement>(null);
  const workOrderFileRef = useRef<HTMLInputElement>(null);
  const tenderDocsRef = useRef<HTMLInputElement>(null);

  /* ================= ESTIMATE ================= */
  const [estimate, setEstimate] = useState<Record<string, string>>({});

  /* ================= DEPARTMENT ================= */
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showDeptModal, setShowDeptModal] = useState(false);

  /* ================= UX ================= */
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /* ================= API ================= */
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const SITE_API = `${API_BASE_URL}/sites`;
  const DEPT_API = `${API_BASE_URL}/departments`;

  /* ================= LOAD DEPARTMENTS ================= */
  const loadDepartments = async () => {
    try {
      const res = await fetch(DEPT_API);
      const json = await res.json();
      setDepartments(json.data || []);
    } catch {
      toast({ title: "❌ Failed to load departments" });
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  /* ================= HELPERS ================= */
  const handleEstimateChange = (key: string, value: string) => {
    setEstimate(prev => ({ ...prev, [key]: value }));
  };

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

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setSiteName("");
    setTenderNo("");
    setDepartmentId("");
    setSdAmount("");
    setEstimate({});
    setSdFile(null);
    setWorkOrderFile(null);
    setTenderDocs([]);

    // 🔥 RESET FILE INPUTS
    if (sdFileRef.current) sdFileRef.current.value = "";
    if (workOrderFileRef.current) workOrderFileRef.current.value = "";
    if (tenderDocsRef.current) tenderDocsRef.current.value = "";
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!siteName) {
      toast({ title: "❌ Site Name is required" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(SITE_API, {
        method: "POST",
        body: buildFormData(),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed");

      toast({ title: "✅ Site Created Successfully" });

      resetForm(); // 🔥 FULL RESET
    } catch (e: any) {
      toast({ title: "❌ Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <Card className="p-6 space-y-8">
        <h2 className="text-2xl font-semibold">Create New Site</h2>

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
            <div className="flex gap-2">
              <select
                className="w-full border rounded-md px-3 py-2"
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
              >
                <option value="">Select</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <Button variant="outline" size="icon" onClick={() => setShowDeptModal(true)}>
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* FILES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <Label>SD Amount</Label>
            <Input value={sdAmount} onChange={e => setSdAmount(e.target.value)} />
          </div>

          <div>
            <Label>Upload SD</Label>
            <Input ref={sdFileRef} type="file" onChange={e => setSdFile(e.target.files?.[0] || null)} />
          </div>

          <div>
            <Label>Upload Work Order</Label>
            <Input ref={workOrderFileRef} type="file" onChange={e => setWorkOrderFile(e.target.files?.[0] || null)} />
          </div>
        </div>

        <div>
          <Label>All Tender Documents</Label>
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
            "Cement","Metal","Sand","Labour","Royalty","Over Head",
            "Lead","Dressing","Water & Compaction","Loading"
          ].map(item => (
            <Input
              key={item}
              placeholder={item}
              value={estimate[item] || ""}
              onChange={e => handleEstimateChange(item, e.target.value)}
            />
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-center gap-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>

          <Button variant="outline" type="button" onClick={resetForm}>
            Reset
          </Button>
        </div>
      </Card>

      {/* DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-background w-[700px] h-[500px] rounded-xl relative">
            <button
              className="absolute right-3 top-3"
              onClick={() => {
                setShowDeptModal(false);
                loadDepartments();
              }}
            >
              <X />
            </button>
            <iframe src="/en/department" className="w-full h-full rounded-xl" />
          </div>
        </div>
      )}
    </>
  );
}
