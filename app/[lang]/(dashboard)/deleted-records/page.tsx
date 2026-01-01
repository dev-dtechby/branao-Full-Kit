"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ========= SHADCN ========= */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ========= ICONS ========= */
import { Eye } from "lucide-react";

/* ================= TYPES ================= */
interface AuditLog {
  id: string;
  userId?: string | null;
  module: string;
  recordId: string;
  action: string;
  oldData?: any;
  newData?: any;
  ip?: string | null;
  createdAt: string;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const API_URL = `${BASE_URL}/api/audit-log`;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const [openView, setOpenView] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  /* ================= LOAD LOGS ================= */
  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const json = await res.json();
      setLogs(json.data || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return logs.filter((l) => {
      const matchSearch =
        l.module.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.recordId.toLowerCase().includes(q) ||
        (l.userId || "").toLowerCase().includes(q);

      const matchModule = moduleFilter
        ? l.module === moduleFilter
        : true;

      const matchAction = actionFilter
        ? l.action === actionFilter
        : true;

      return matchSearch && matchModule && matchAction;
    });
  }, [logs, search, moduleFilter, actionFilter]);

  /* ================= UI ================= */
  return (
    <>
      <Card className="border rounded-xl shadow-sm">
        <CardHeader className="space-y-4">
          <h2 className="text-xl font-semibold">Audit Log</h2>

          {/* FILTER BAR */}
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search user / module / record..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64"
            />

            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="">All Modules</option>
              <option value="Site">Site</option>
              <option value="SiteExpense">SiteExpense</option>
              <option value="Department">Department</option>
            </select>

            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="RESTORE">RESTORE</option>
              <option value="HARD_DELETE">HARD DELETE</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm">
              <thead className="bg-muted/60 border-b">
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Module</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Record ID</th>
                  <th className="px-3 py-2 text-center">View</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center">
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      No audit logs found
                    </td>
                  </tr>
                )}

                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t hover:bg-primary/10 transition"
                  >
                    <td className="px-3 py-2">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-3 py-2">
                      {log.userId || "System"}
                    </td>

                    <td className="px-3 py-2">
                      <Badge variant="outline">{log.module}</Badge>
                    </td>

                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          log.action === "DELETE" ||
                          log.action === "HARD_DELETE"
                            ? "soft"
                            : "outline"
                        }
                      >
                        {log.action}
                      </Badge>
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {log.recordId}
                    </td>

                    <td className="px-3 py-2 text-center">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setSelectedLog(log);
                          setOpenView(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ================= VIEW JSON DIALOG ================= */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Audit Details</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Old Data</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[300px]">
{JSON.stringify(selectedLog.oldData, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-1">New Data</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[300px]">
{JSON.stringify(selectedLog.newData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
