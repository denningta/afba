import { Category } from "@/app/interfaces/categories"

// Spent follows Plaid's sign convention (money in is negative), so flip income
// rows to show what was actually received as a positive amount. (`|| 0` turns
// the -0 of an income row with nothing received yet into 0, not "-$0.00".)
export const actualAmount = (category: Category) =>
  (category.type === 'income' ? -(category.spent ?? 0) : (category.spent ?? 0)) || 0
