import { AlertTriangleIcon, InboxIcon, RotateCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StateMessageProps {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

function StateMessage({ icon, title, description, action, className, tone }: StateMessageProps & {
  icon: React.ReactNode
  tone: 'muted' | 'error'
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={cn("flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", className)}
    >
      <div className={cn(
        "flex size-10 items-center justify-center rounded-full [&_svg]:size-5",
        tone === 'error' ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
      )}>
        {icon}
      </div>
      <div className="font-medium">{title}</div>
      {description && <div className="max-w-sm text-sm text-muted-foreground">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// A failed load. Pass onRetry to offer a Retry button (e.g. an SWR mutate).
export function ErrorState({ title = "Couldn't load this data", error, onRetry, className }: {
  title?: string
  error?: unknown
  onRetry?: () => void
  className?: string
}) {
  const message = error instanceof Error ? error.message : undefined
  return (
    <StateMessage
      tone="error"
      icon={<AlertTriangleIcon />}
      title={title}
      description={message ?? "The server didn't respond as expected. Check that the app and database are running."}
      action={onRetry &&
        <Button variant="outline" onClick={onRetry}>
          <RotateCwIcon />
          Retry
        </Button>
      }
      className={className}
    />
  )
}

// Nothing to show yet - an explanation and, optionally, the next step.
export function EmptyState({ icon = <InboxIcon />, ...props }: StateMessageProps & { icon?: React.ReactNode }) {
  return <StateMessage tone="muted" icon={icon} {...props} />
}
