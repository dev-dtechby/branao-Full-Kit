"use client";

import { useSearchParams } from "next/navigation";
import SiteForm from "./components/SiteForm";
import EditSiteForm from "./components/EditSiteForm";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  const searchParams = useSearchParams();
  const siteId = searchParams.get("id");

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="text-2xl font-semibold text-default-900">
        {siteId ? "Edit Site Entry" : "Create New Site Entry"}
      </div>

      {/* Form Card */}
      <div className="p-0">
        {siteId ? (
          <EditSiteForm siteId={siteId} />
        ) : (
          <SiteForm />
        )}
      </div>
    </div>
  );
}
