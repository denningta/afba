import type { Metadata } from "next";
import { Suspense } from "react";
import Upload from "@/app/components/Upload";
import PageHeader from "@/app/components/common/PageHeader";

export const metadata: Metadata = { title: "Import" }

export default async function UploadPage() {
  return (
    <>
      <PageHeader title="Import" description="Upload transactions from a CSV file." />
      <Suspense>
        <Upload />
      </Suspense>
    </>
  )
}
