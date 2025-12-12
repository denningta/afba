import { Suspense } from "react";
import Upload from "../components/Upload";

export default async function UploadPage() {
  return (
    <Suspense>
      <Upload />
    </Suspense>
  )
}
