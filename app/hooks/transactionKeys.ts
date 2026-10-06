// SWR keys that hold transaction lists, e.g. /api/transactions?needsCategory=true
// (but not /api/transactions/count or /sync).
export const isTransactionListKey = (key: unknown) =>
  typeof key === 'string' && (key === '/api/transactions' || key.startsWith('/api/transactions?'))

// Everything whose numbers include transactions: lists, counts, budgets,
// spending, and the forecast.
export const isTransactionDerivedKey = (key: unknown) =>
  typeof key === 'string'
  && ['/api/transactions', '/api/categories', '/api/budget', '/api/category-spending', '/api/forecast']
    .some(prefix => key.startsWith(prefix))
