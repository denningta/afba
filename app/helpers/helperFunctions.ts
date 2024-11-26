import Transaction from "../interfaces/transaction"

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
