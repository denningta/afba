import Transaction from "../interfaces/transaction"

export function isOdd(input: number) {
  return input % 2 === 1 ? true : false
}

export function dateToYYYYMM(input: Date) {
  const year = input.getFullYear().toString()
  const month = ("0" + (input.getMonth() + 1)).slice(-2)

  return `${year}-${month}`
}

export function getPrevMonthString(date: string, months: number) {
  if (!date.match(/[0-9]{4}-[0-1]{1}[0-9]{1}/)) throw new Error('Not a valid date. Must be in format YYYY-MM')
  let [year, month] = date.split('-').map(el => +el)

  const diff = month - months

  const newYear = diff <= 0 ? (year + Math.floor((diff ?? 12) / 12)) : year
  const newMonth = diff <= 0 ? 12 + diff : diff

  const formattedMonth = month < 10 ? `0${newMonth}` : `${newMonth}`

  const dateString = `${newYear}-${formattedMonth}`

  debugger
  return dateString
}

export function getPrevMonth(date: string, months: number) {
  if (!date.match(/[0-9]{4}-[0-1]{1}[0-9]{1}/)) throw new Error('Not a valid date. Must be in format YYYY-MM')
  let [year, month] = date.split('-').map(el => +el)
  const newDate = new Date(year, month - 1 - months, 1)

  return dateToYYYYMM(newDate)
}


export function deleteUndefinedKeys(object: Object) {
  const keys = Object.keys(object) as Array<keyof typeof object>
  keys.forEach((key) =>
    object[key] === null ? delete object[key] : {}
  )
  return object
}

export function isValidDate(d: any) {
  return d instanceof Date && !isNaN(d as any);
}

export function searchParamsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams)
}

export const monthStrings = [
  { id: 1, name: 'January' },
  { id: 2, name: 'February' },
  { id: 3, name: 'March' },
  { id: 4, name: 'April' },
  { id: 5, name: 'May' },
  { id: 6, name: 'June' },
  { id: 7, name: 'July' },
  { id: 8, name: 'August' },
  { id: 9, name: 'September' },
  { id: 10, name: 'October' },
  { id: 11, name: 'November' },
  { id: 12, name: 'December' },
]

export function getMonthString(id: number) {
  return monthStrings.find(el => el.id === id)?.name
}

export function aggregateByMonth(data: Transaction[]) {
  const monthYearCount = data.reduce((acc: Record<string, number> | undefined, item) => {
    if (!item.date) return
    const date = new Date(item.date)
    const month = date.toLocaleString('en-US', { month: 'long' })
    const year = date.getFullYear().toString()
    const key = month + ' ' + year

    if (!acc) return
    if (!acc[key]) acc[key] = 0
    acc[key]++
    return acc
  }, {})

  if (!monthYearCount) return
  return Object.keys(monthYearCount).map(key => ({
    month: key,
    records: monthYearCount
  }))
}

export function monthDiff(d1: Date, d2: Date) {
  var months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}
