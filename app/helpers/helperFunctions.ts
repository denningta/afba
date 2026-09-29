import Transaction from "../interfaces/transaction"
import { format, isValid, parse, parseISO } from "date-fns"

export function isOdd(input: number) {
  return input % 2 === 1 ? true : false
}

export function dateToYYYYMM(input: Date) {
  const year = input.getFullYear().toString()
  const month = ("0" + (input.getMonth() + 1)).slice(-2)

  return `${year}-${month}`
}

export function YYYYMMToDate(input: string) {
  if (!input.match(/[0-9]{4}-[0-1]{1}[0-9]{1}/)) throw new Error('Not a valid date. Must be in format YYYY-MM')
  const [year, month] = input.split('-')
  let monthIndex = +month - 1
  let yearIndex = +year

  return new Date(yearIndex, monthIndex)
}

export function getPrevMonthString(date: string, months: number) {
  if (!date.match(/[0-9]{4}-[0-1]{1}[0-9]{1}/)) throw new Error('Not a valid date. Must be in format YYYY-MM')
  let [year, month] = date.split('-').map(el => parseInt(el))

  const totalMonths = year * 12 + (month - 1) - months
  const newYear = Math.floor(totalMonths / 12)
  const newMonth = (totalMonths % 12) + 1
  const formattedMonth = newMonth < 10 ? `0${newMonth}` : `${newMonth}`

  return `${newYear}-${formattedMonth}`

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


function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0'); // convert to Hex and pad with 0
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateHexColors(
  numColors: number,
  hueStart: number,
  hueEnd: number,
  saturation?: number,
  lightness?: number
) {
  const colors = [];
  const hueStep = (hueEnd - hueStart) / numColors;

  for (let i = 0; i < numColors; i++) {
    const hue = hueStart + i * hueStep;
    colors.push(hslToHex(hue, saturation ?? 70, lightness ?? 50));
  }

  return colors;
}


export function toCurrency(number: number) {
  return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// Transaction dates are stored as MM/DD/YYYY; Plaid-sourced fields (recurring
// streams, balance history) use YYYY-MM-DD. Both parse as local dates, so
// nothing slips a day in US time zones. Returns null when unparseable.
export function parseDisplayDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)
    ? parse(value, 'M/d/yyyy', new Date())
    : parseISO(value)
  return isValid(date) ? date : null
}

// "Sep 12", or "Sep 12, 2025" outside the current year.
export function formatShortDate(value: string | null | undefined) {
  const date = parseDisplayDate(value)
  if (!date) return value ?? ''
  return format(date, date.getFullYear() === new Date().getFullYear() ? 'MMM d' : 'MMM d, yyyy')
}

// Plaid enum values like FOOD_AND_DRINK -> "Food and drink".
export function humanizeEnum(value: string | null | undefined) {
  if (!value) return ''
  const text = value.replace(/_/g, ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// The page listing one budget category's transactions for its month.
export function categoryTransactionsHref({ _id, date }: { _id?: unknown, date?: string }) {
  return `/budget/${date}/${String(_id)}`
}
