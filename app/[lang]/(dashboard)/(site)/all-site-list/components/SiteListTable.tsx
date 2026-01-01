"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Download,
  Pencil,
  Trash2,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import { exportToExcel, exportToPDF } from "@/lib/exportUtils";

/* ================= TYPES ================= */
type DocumentType = "SD" | "WORK_ORDER" | "TENDER";

interface SiteDocument {
  id: string;
  type: DocumentType;
  secureUrl: string;
  originalName?: string | null;
}

interface Site {
  id: string;
  siteName: string;
  tenderNo?: string | null;
  sdAmount?: number | null;
  department?: {
    id: string;
    name: string;
  } | null;
  sdFile?: SiteDocument | null;
  workOrderFile?: SiteDocument | null;
  tenderDocs?: SiteDocument[];
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const API_URL = `${BASE_URL}/api/sites`;

/* ================= HELPERS ================= */
const isImage = (url: string) => /\.(jpg|jpeg|png|webp)$/i.test(url);
const isPdf = (url: string) => /\.pdf$/i.test(url);

const getDownloadUrl = (url: string) =>
  url.includes("/upload/")
    ? url.replace("/upload/", "/upload/fl_attachment/")
    : url;

/* ================= COMPONENT ================= */
export default function SiteListTable() {
  const router = useRouter();
  const { lang } = useParams();

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewDoc, setPreviewDoc] = useState<SiteDocument | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  /* ================= FETCH ================= */
  const fetchSites = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await fetch(API_URL);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Route not found");
      setSites(json.data || []);
    } catch (err: any) {
      setApiError(err.message || "Route not found");
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  /* ================= SEARCH ================= */
  const filteredSites = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return sites;

    return sites.filter((s) =>
      [
        s.siteName,
        s.tenderNo,
        s.department?.name,
        s.sdAmount?.toString(),
      ]
        .filter(Boolean)
        .some((field) =>
          field!.toLowerCase().includes(q)
        )
    );
  }, [sites, search]);


  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this site?")) return;
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (res.ok) fetchSites();
    else alert("❌ Delete failed");
  };

  /* ================= EXPORT DATA (FINAL) ================= */
  const exportData = filteredSites.map((s) => ({
    "Site Name": s.siteName,
    "Tender No": s.tenderNo || "",
    Department: s.department?.name || "",
    "SD Amount": s.sdAmount || "",
    "SD URL": s.sdFile?.secureUrl || "",
    "Work Order URL": s.workOrderFile?.secureUrl || "",
    "Tender Docs URL": s.tenderDocs
      ?.map((d) => d.secureUrl)
      .join(", "),
  }));

  /* ================= UI ================= */
  return (
    <>
      <Card className="border rounded-xl shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between gap-3">
            <CardTitle className="text-lg font-semibold">
              All Site List
            </CardTitle>

            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search Site..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:w-64"
              />

              <Button
                variant="outline"
                onClick={() => exportToExcel(exportData, "All_Sites")}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>

              <Button
                variant="outline"
                onClick={() => exportToPDF(exportData, "All_Sites")}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto overflow-y-hidden">
            <table className="min-w-[1600px] w-full text-sm">
              <thead className="bg-muted/80 border-b border-border">
                <tr>
                  {[
                    "Site Name",
                    "Tender No",
                    "Department",
                    "SD Amount",
                    "SD",
                    "Work Order",
                    "Tender Docs",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="
                        px-4 py-3
                        text-left
                        font-semibold
                        text-xs
                        uppercase
                        tracking-wide
                        text-muted-foreground
                        whitespace-nowrap
                      "
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>


              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && apiError && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-red-500 font-medium"
                    >
                      {apiError}
                    </td>
                  </tr>
                )}

                {!loading &&
                  !apiError &&
                  filteredSites.map((s) => (
                    <tr
                      key={s.id}
                      className="
                        border-t
                        transition-all
                        duration-200
                        hover:bg-primary/10
                        hover:shadow-sm
                        cursor-pointer
                        group
                      "
                    >
                      {/* SITE NAME */}
                      <td className="px-4 py-3 font-medium text-foreground">
                        {s.siteName}
                      </td>

                      {/* TENDER NO */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.tenderNo || "-"}
                      </td>

                      {/* DEPARTMENT */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.department?.name || "-"}
                      </td>

                      {/* SD AMOUNT */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.sdAmount ? `₹ ${s.sdAmount}` : "-"}
                      </td>

                      {/* SD */}
                      <td className="px-4 py-3">
                        {s.sdFile && (
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="group-hover:border-primary"
                              onClick={() => setPreviewDoc(s.sdFile!)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="group-hover:border-primary"
                              onClick={() =>
                                window.open(
                                  getDownloadUrl(s.sdFile!.secureUrl),
                                  "_blank"
                                )
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>

                      {/* WORK ORDER */}
                      <td className="px-4 py-3">
                        {s.workOrderFile && (
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="group-hover:border-primary"
                              onClick={() =>
                                setPreviewDoc(s.workOrderFile!)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="group-hover:border-primary"
                              onClick={() =>
                                window.open(
                                  getDownloadUrl(
                                    s.workOrderFile!.secureUrl
                                  ),
                                  "_blank"
                                )
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>

                      {/* TENDER DOCS */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {s.tenderDocs?.map((d) => (
                            <Button
                              key={d.id}
                              size="icon"
                              variant="outline"
                              className="group-hover:border-primary"
                              onClick={() =>
                                window.open(
                                  getDownloadUrl(d.secureUrl),
                                  "_blank"
                                )
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ))}
                        </div>
                      </td>

                      {/* ACTION */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2 items-center justify-center">
                          <Button
                            size="icon"
                            variant="outline"
                            className="group-hover:border-primary"
                            onClick={() =>
                              router.push(
                                `/${lang}/create-new-site?id=${s.id}`
                              )
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="outline"
                            className="group-hover:border-destructive"
                            onClick={() => handleDelete(s.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>

            </table>
          </div>
        </CardContent>
      </Card>

      {/* PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-background p-4 rounded-lg w-[90%] h-[90%]">
            <div className="flex justify-between mb-2">
              <span className="font-medium">
                {previewDoc.originalName || "Document Preview"}
              </span>
              <Button
                variant="outline"
                onClick={() => setPreviewDoc(null)}
              >
                Close
              </Button>
            </div>

            {isImage(previewDoc.secureUrl) ? (
              <img
                src={previewDoc.secureUrl}
                className="w-full h-full object-contain"
              />
            ) : isPdf(previewDoc.secureUrl) ? (
              <iframe
                src={previewDoc.secureUrl}
                className="w-full h-full rounded"
              />
            ) : (
              <p className="text-center">Unsupported file</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
