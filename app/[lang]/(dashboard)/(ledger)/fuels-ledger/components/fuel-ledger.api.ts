// Example: app/[lang]/(dashboard)/(ledger)/fuels-ledger/components/fuel-ledger.api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const API = `${BASE_URL}/api/fuel-station-ledger`;

export async function deleteOne(id: string) {
  if (!id) throw new Error("id required");

  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    cache: "no-store",
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Delete failed");

  return json;
}
