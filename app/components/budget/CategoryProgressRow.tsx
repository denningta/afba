import { Category } from "@/app/interfaces/categories"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { Progress } from "@/components/ui/progress"
import { actualAmount } from "./CategoriesColDefs"

// Name, "actual / budget" and a progress bar for one category. Spending is on
// track at or under budget; income is on track once it reaches its plan.
export default function CategoryProgressRow({ category, action }: { category: Category, action?: React.ReactNode }) {
  const actual = actualAmount(category)
  const budget = category.budget ?? 0
  const percent = budget > 0 ? Math.round((actual / budget) * 100) : actual > 0 ? 100 : 0
  const onTrack = category.type === 'income' ? actual >= budget : actual <= budget

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="truncate font-medium">{category.name}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            <span className="text-foreground">{toCurrency(actual)}</span> / {toCurrency(budget)}
          </span>
        </div>
        <Progress
          className="h-2"
          value={Math.min(Math.max(percent, 0), 100)}
          indicatorClassName={onTrack ? 'bg-positive' : 'bg-negative'}
        />
      </div>
      {action}
    </div>
  )
}
