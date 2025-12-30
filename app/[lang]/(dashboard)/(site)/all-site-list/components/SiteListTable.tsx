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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Download, Pencil, Trash2 } from "lucide-react";

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

/* ================= API CONFIG (FIXED) ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const API_URL = `${BASE_URL}/api/sites`;

/* ================= HELPERS ================= */
const isImage = (url: string) =>
  /\.(jpg|jpeg|png|webp)$/i.test(url);

const isPdf = (url: string) =>
  /\.pdf$/i.test(url);

const getDownloadUrl = (url: string) =>
  url.includes("/upload/")
    ? url.replace("/upload/", "/upload/fl_attachment/")
    : url;

/* ================= COMPONENT ================= */
export default function SiteListTable() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang;

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

      if (!res.ok) {
        throw new Error(json?.message || "Route not found");
      }

      setSites(json.data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
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
    return sites.filter((s) =>
      s.siteName.toLowerCase().includes(search.toLowerCase())
    );
  }, [sites, search]);

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this site?")) return;

    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (res.ok) fetchSites();
    else alert("❌ Delete failed");
  };

  /* ================= EXPORT ================= */
  const exportCSV = () => {
    const headers = ["Site Name", "Tender No", "Department", "SD Amount"];
    const rows = sites.map((s) => [
      s.siteName,
      s.tenderNo || "",
      s.department?.name || "",
      s.sdAmount || "",
    ]);

    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sites.csv";
    a.click();
  };

  /* ================= UI ================= */
  return (
    <>
      <Card className="p-6 shadow-sm border rounded-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-3">
            <CardTitle className="text-xl font-semibold">
              All Site List
            </CardTitle>

            <div className="flex gap-2">
              <Input
                placeholder="Search Site..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:w-64"
              />
              <Button onClick={exportCSV}>Export</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="w-full overflow-auto rounded-md border">
            <table className="min-w-[1200px] w-full table-auto">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Site Name</th>
                  <th className="p-3 text-left">Tender No</th>
                  <th className="p-3 text-left">Department</th>
                  <th className="p-3 text-left">SD Amount</th>
                  <th className="p-3 text-left">SD</th>
                  <th className="p-3 text-left">Work Order</th>
                  <th className="p-3 text-left">Tender Docs</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="p-4 text-center">
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && apiError && (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-red-500">
                      {apiError}
                    </td>
                  </tr>
                )}

                {!loading && !apiError && filteredSites.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-4 text-center">
                      No site records found.
                    </td>
                  </tr>
                )}

                {!loading && !apiError &&
                  filteredSites.map((s) => (
                    <tr key={s.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">{s.siteName}</td>
                      <td className="p-3">{s.tenderNo || "-"}</td>
                      <td className="p-3">{s.department?.name || "-"}</td>
                      <td className="p-3">
                        {s.sdAmount ? `₹ ${s.sdAmount}` : "-"}
                      </td>

                      <td className="p-3 flex gap-2">
                        {s.sdFile && (
                          <>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setPreviewDoc(s.sdFile!)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                window.open(
                                  getDownloadUrl(s.sdFile!.secureUrl),
                                  "_blank"
                                )
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </td>

                      <td className="p-3 flex gap-2">
                        {s.workOrderFile && (
                          <>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                setPreviewDoc(s.workOrderFile!)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
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
                          </>
                        )}
                      </td>

                      <td className="p-3 flex gap-2">
                        {s.tenderDocs?.map((d) => (
                          <Button
                            key={d.id}
                            size="icon"
                            variant="outline"
                            title={d.originalName || "Tender Doc"}
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
                      </td>

                      <td className="p-3">
                        <div className="flex flex-col gap-2 items-center">
                          <Button
                            size="icon"
                            variant="outline"
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
          </ScrollArea>
        </CardContent>
      </Card>

      {/* PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-background p-4 rounded-lg w-[85%] h-[85%]">
            <div className="flex justify-between mb-2">
              <span className="font-medium">
                {previewDoc.originalName || "Document Preview"}
              </span>
              <Button variant="outline" onClick={() => setPreviewDoc(null)}>
                Close
              </Button>
            </div>

            {isImage(previewDoc.secureUrl) ? (
              <img
                src={previewDoc.secureUrl}
                className="w-full h-full object-contain rounded"
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
