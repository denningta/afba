
export function isOdd(input: number) {
  return input % 2 === 1 ? true : false
}

export function dateToYYYYMM(input: Date) {
  const year = input.getFullYear().toString()
  const month = ("0" + (input.getMonth() + 1)).slice(-2)

  return `${year}-${month}`
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
