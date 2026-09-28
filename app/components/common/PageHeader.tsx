import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  // Page-level actions, right-aligned on desktop and stacked under the title on mobile.
  actions?: React.ReactNode
  // Optional row below the title, e.g. filters.
  children?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, description, actions, children, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 space-y-4", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
