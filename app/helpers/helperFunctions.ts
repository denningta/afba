import { BudgetOverview } from "../components/budget/BudgetOverview"
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


export const getPlaceholderData = (
  data: BudgetOverview[],
  start: string,
  end: string
) => {
  let placeholderData: BudgetOverview[] = []

  const monthsDiff = monthDiff(new Date(start), new Date(end))

  for (let index = 0; index <= monthsDiff; index++) {
    const dateStr = getPrevMonth(end, index)


    placeholderData.unshift({
      _id: dateStr,
      date: dateStr,
      totalSpent: 0,
      totalBudget: 0,
      categories: [],
      transactions: []
    })
  }

  const pData = placeholderData.map(placeholder =>
    data.find(el => el.date === placeholder.date) ?? placeholder
  )

  return pData
}

interface DateObject {
  date?: string | null
  [key: string]: any
}

export function generateMonthDates(yearMonth: string): DateObject[] {
  // Validate input format (YYYY-MM)
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!regex.test(yearMonth)) {
    throw new Error('Invalid input format. Expected "YYYY-MM" (e.g., "2025-08").');
  }

  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1); // Month is 0-based in JS Date

  // Validate year and month
  if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1) {
    throw new Error('Invalid year or month.');
  }

  // Get number of days in the month
  const daysInMonth = new Date(year, month, 0).getDate();

  // Generate array of date objects
  const result: DateObject[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    // Format day with leading zero if needed
    const dayStr = day.toString().padStart(2, '0');
    result.push({ date: `${year}-${month.toString().padStart(2, '0')}-${dayStr}` });
  }

  return result;
}


/**
 * Performs a left join on two arrays of objects based on their 'date' property.
 * All objects from array1 are included in the result. Objects in array2 with undefined or null 'date' are filtered out.
 * @param array1 - First array of objects with a 'date' property.
 * @param array2 - Second array of objects with a 'date' property.
 * @returns An array of merged objects, including all array1 objects, with matching array2 objects where available.
 */
export function joinArraysOnDate<T extends DateObject, U extends DateObject>(array1: T[], array2: U[]): T[] {
  // Filter array2 to exclude objects with undefined or null date
  const filteredArray2 = array2.filter(item => item.date !== undefined && item.date !== null);

  // Create a map for faster lookup from filtered array2
  const map2 = new Map<string, U>();
  for (const item of filteredArray2) {
    // Type assertion since we know date is not undefined/null after filtering
    map2.set(item.date!, item);
  }

  // Perform left join
  const result: T[] = [];
  for (const item1 of array1) {
    if (item1.date !== undefined && item1.date !== null) {
      const match = map2.get(item1.date);
      if (match) {
        // Merge objects, prioritizing item1 properties in case of overlap
        result.push({ ...match, ...item1 });
      } else {
        // No match, include only array1 object
        result.push({ ...item1 });
      }
    } else {
      // Include array1 object even if date is undefined or null
      result.push({ ...item1 });
    }
  }

  return result;
}
