import type { Metadata } from "next"
import AssistantChat from "@/app/components/assistant/AssistantChat"

export const metadata: Metadata = { title: "Assistant" }

export default function AssistantPage() {
  return <AssistantChat />
}
