import { AlertCircleIcon } from "lucide-react"

export default function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  )
}
