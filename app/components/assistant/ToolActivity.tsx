'use client'

import { CheckIcon, LoaderCircleIcon, TriangleAlertIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChatToolActivity } from "@/app/interfaces/assistant"
import { cn } from "@/lib/utils"

// What the assistant looked up to answer: one chip per lookup, with the exact
// arguments a click away, so answers can be checked.
export default function ToolActivity({ tools }: { tools: ChatToolActivity[] }) {
  if (!tools.length) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {tools.map(tool => (
        <Popover key={tool.id}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted",
                tool.error && "border-warning/50 text-foreground",
              )}
            >
              {!tool.done
                ? <LoaderCircleIcon className="size-3 animate-spin" />
                : tool.error
                  ? <TriangleAlertIcon className="size-3 text-warning" />
                  : <CheckIcon className="size-3 text-positive" />
              }
              {tool.label}{tool.summary && ` · ${tool.summary}`}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 space-y-2 text-xs">
            <div className="font-medium">{tool.name}</div>
            {tool.error && <div className="text-warning">{tool.error}</div>}
            <pre className="max-h-48 overflow-auto rounded bg-muted p-2 font-mono">
              {JSON.stringify(tool.input ?? {}, null, 2)}
            </pre>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  )
}
