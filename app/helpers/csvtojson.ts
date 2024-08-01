import camelcase from 'camelcase'
import csv from 'csvtojson'

export default async function csvtojson(input: string): Promise<any[] | null> {
  const array = await csv({
    colParser: {
      'date': (item) => new Date(item).toLocaleDateString(),
      'amount': (item) => parseFloat(item)
    }
  }).fromString(headersToCamelCase(input))

  return array
}

function headersToCamelCase(input: string): string {
  const parsed = input.match(/(.+)/)
  if (!parsed) return ''

  const headers = parsed[0]
    .split(',')
    .map(header => camelcase(header))
    .join()

  const result = input.replace(/(.+)/, headers)
  return result
}

export function getFirstDayOfMonth(): Date {
  var date = new Date();
  var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return firstDay
}
