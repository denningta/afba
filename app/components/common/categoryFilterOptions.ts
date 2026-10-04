import { format, subMonths } from "date-fns"
import { FilterOption, FilterOptionGroup } from "./ColumnFilter"

// How far back (from the newest category in view) a category still counts as
// in use; anything older is tucked away until asked for or searched.
const RECENT_CATEGORY_MONTHS = 3

// Splits category options into recently used ones and older ones (collapsed),
// by the latest YYYY-MM month each category existed in. Keeps the given order.
export function groupCategoriesByRecency(items: { option: FilterOption, latest: string }[]): FilterOptionGroup[] {
  const newest = items.reduce((max, { latest }) => latest > max ? latest : max, '')
  const cutoff = newest
    ? format(subMonths(new Date(`${newest}-01T00:00:00`), RECENT_CATEGORY_MONTHS - 1), 'yyyy-MM')
    : ''

  const recent: FilterOptionGroup = { heading: 'Categories', options: [] }
  const older: FilterOptionGroup = { heading: 'Older categories', options: [], collapsed: true }
  items.forEach(({ option, latest }) => (latest >= cutoff ? recent : older).options.push(option))
  return [recent, older]
}
