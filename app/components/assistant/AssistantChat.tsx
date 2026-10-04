'use client'

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ArrowUpIcon, HistoryIcon, PlusIcon, SparklesIcon, SquareIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import useAssistantChat, { useConversations } from "@/app/hooks/useAssistantChat"
import useAiSettings from "@/app/hooks/useAiSettings"
import useCurrentUser from "@/app/hooks/useCurrentUser"
import { ChatTurn, ConversationSummary } from "@/app/interfaces/assistant"
import { cn } from "@/lib/utils"
import { EmptyState, ErrorState } from "../common/StateMessage"
import Markdown from "./Markdown"
import ToolActivity from "./ToolActivity"

const SUGGESTIONS = [
  "How am I doing against this month's budget?",
  "Which categories am I over budget in?",
  "How did groceries compare to budget over the last 6 months?",
  "What were my 10 biggest purchases last month?",
  "Why might my bank balance and budget actuals not match this month?",
]

export default function AssistantChat() {
  const settings = useAiSettings()
  const { isAdmin } = useCurrentUser()
  const chat = useAssistantChat()
  const conversations = useConversations()
  const [historyOpen, setHistoryOpen] = useState(false)

  if (settings.error) {
    return <Card><ErrorState title="Couldn't load the assistant" error={settings.error} onRetry={() => settings.mutate()} /></Card>
  }
  if (settings.isLoading || !settings.data) return <Skeleton className="h-96 w-full" />

  if (!settings.data.configured) {
    return (
      <Card>
        <EmptyState
          title="Connect an AI provider to start"
          description={isAdmin
            ? "Add an API key from Anthropic and everyone in the household can ask questions about the budget here."
            : "Ask a household admin to connect an AI provider in Settings."}
          action={isAdmin && <Button asChild><Link href="/settings/ai">Set up the assistant</Link></Button>}
        />
      </Card>
    )
  }

  const history = (
    <ConversationList
      conversations={conversations.data}
      activeId={chat.conversationId}
      onOpen={(id) => { chat.open(id); setHistoryOpen(false) }}
      onDelete={chat.remove}
    />
  )

  return (
    // Fills the viewport under the app header (h-14) and the page padding (py-6).
    <div className="flex h-[calc(100dvh-6.5rem)] gap-4">
      <aside className="hidden w-64 shrink-0 flex-col gap-2 md:flex">
        <Button variant="outline" onClick={chat.reset} disabled={chat.streaming}>
          <PlusIcon /> New chat
        </Button>
        <div className="min-h-0 flex-1 overflow-y-auto">{history}</div>
      </aside>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader><SheetTitle>Conversations</SheetTitle></SheetHeader>
          <div className="overflow-y-auto px-2">{history}</div>
        </SheetContent>
      </Sheet>

      <Card className="flex min-w-0 flex-1 flex-col gap-0 overflow-hidden py-0">
        <div className="flex items-center gap-2 border-b px-3 py-2 md:hidden">
          <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}><HistoryIcon /> History</Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={chat.reset} disabled={chat.streaming}>
            <PlusIcon /> New chat
          </Button>
        </div>

        <Messages turns={chat.turns} loading={chat.loading} streaming={chat.streaming} onSuggestion={chat.send} />

        <Composer streaming={chat.streaming} onSend={chat.send} onStop={chat.stop} />
      </Card>
    </div>
  )
}

function ConversationList({ conversations, activeId, onOpen, onDelete }: {
  conversations?: ConversationSummary[]
  activeId: string | null
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (!conversations) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
  if (!conversations.length) return <p className="px-2 py-4 text-sm text-muted-foreground">No conversations yet.</p>

  return (
    <ul className="space-y-1">
      {conversations.map(c => (
        <li key={c.id} className="group relative">
          <button
            type="button"
            onClick={() => onOpen(c.id)}
            className={cn(
              "w-full rounded-md px-2 py-1.5 pr-8 text-left text-sm transition-colors hover:bg-muted",
              c.id === activeId && "bg-muted font-medium",
            )}
          >
            <div className="truncate">{c.title}</div>
            <div className="text-xs font-normal text-muted-foreground">
              {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
            </div>
          </button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${c.title}`}
            className="absolute top-1.5 right-1 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => onDelete(c.id)}
          >
            <Trash2Icon />
          </Button>
        </li>
      ))}
    </ul>
  )
}

function Messages({ turns, loading, streaming, onSuggestion }: {
  turns: ChatTurn[]
  loading: boolean
  streaming: boolean
  onSuggestion: (text: string) => void
}) {
  const endRef = useRef<HTMLDivElement>(null)

  // Follow the reply as it streams in.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [turns])

  if (loading) {
    return <div className="flex-1 space-y-4 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
  }

  if (!turns.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SparklesIcon className="size-5" />
        </div>
        <div>
          <div className="font-medium">Ask about your budget</div>
          <p className="text-sm text-muted-foreground">Answers come from your own budget, transactions and accounts.</p>
        </div>
        <div className="flex max-w-xl flex-wrap justify-center gap-2">
          {SUGGESTIONS.map(s => (
            <Button key={s} variant="outline" size="sm" className="h-auto whitespace-normal py-1.5 text-left font-normal" onClick={() => onSuggestion(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4" aria-live="polite">
      {turns.map((turn, i) => {
        const isLast = i === turns.length - 1
        if (turn.role === 'user') {
          return (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">
                {turn.text}
              </div>
            </div>
          )
        }
        const thinking = streaming && isLast && !turn.text && !turn.error
        return (
          <div key={i} className="max-w-[95%] space-y-2">
            {turn.tools && <ToolActivity tools={turn.tools} />}
            {turn.text && <Markdown>{turn.text}</Markdown>}
            {thinking && !turn.tools?.length &&
              <div className="flex gap-1 py-2" aria-label="Thinking">
                {[0, 150, 300].map(delay => (
                  <span key={delay} className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            }
            {turn.error &&
              <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                {turn.error}
              </div>
            }
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}

function Composer({ streaming, onSend, onStop }: {
  streaming: boolean
  onSend: (text: string) => void
  onStop: () => void
}) {
  const [text, setText] = useState('')

  const submit = () => {
    if (!text.trim() || streaming) return
    onSend(text)
    setText('')
  }

  return (
    <form
      className="flex items-end gap-2 border-t p-3"
      onSubmit={(e) => { e.preventDefault(); submit() }}
    >
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends; Shift+Enter adds a line.
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder="Ask about your budget…"
        aria-label="Message"
        rows={1}
        maxLength={4000}
        className="max-h-40 min-h-10 resize-none"
      />
      {streaming
        ? <Button type="button" size="icon" variant="secondary" onClick={onStop} aria-label="Stop"><SquareIcon /></Button>
        : <Button type="submit" size="icon" disabled={!text.trim()} aria-label="Send"><ArrowUpIcon /></Button>
      }
    </form>
  )
}
