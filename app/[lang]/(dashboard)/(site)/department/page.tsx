"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Department {
  id: string;
  name: string;
}

export default function DepartmentPage() {
  const [name, setName] = useState("");
  const [list, setList] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  /* =================================================
     API BASE (SAFE FOR LOCAL + PROD)
     ================================================= */
  const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

  const API = `${BASE_URL}/api/departments`;

  /* ================= LOAD ================= */
  const load = async () => {
    try {
      const res = await fetch(API, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch departments");
      }

      const json = await res.json();
      setList(json?.data ?? []);
    } catch (err) {
      console.error("Department Load Error:", err);
      toast({
        title: "❌ Error",
        description: "Failed to load departments",
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ================= ADD ================= */
  const add = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Add failed");
      }

      toast({
        title: "✅ Department Added",
        description: name,
      });

      setName("");
      load();

      // notify parent (site form)
      window.parent.postMessage("DEPT_ADDED", "*");
    } catch (err: any) {
      console.error("Department Add Error:", err);
      toast({
        title: "❌ Error",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const del = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;

    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      toast({
        title: "🗑️ Deleted",
        description: "Department removed",
      });

      load();
      window.parent.postMessage("DEPT_ADDED", "*");
    } catch (err) {
      console.error("Department Delete Error:", err);
      toast({
        title: "❌ Error",
        description: "Delete failed",
      });
    }
  };

  /* ================= UI ================= */
  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Department Master</h2>

      {/* ADD */}
      <div className="flex gap-3">
        <Input
          placeholder="Department Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={add} disabled={loading}>
          {loading ? "Adding..." : "Add"}
        </Button>
      </div>

      {/* LIST */}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-center w-[120px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="p-4 text-center text-muted-foreground"
                >
                  No departments added yet
                </td>
              </tr>
            )}

            {list.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-2">{d.name}</td>
                <td className="p-2 text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => del(d.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
