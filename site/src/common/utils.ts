
export const cls = (...classes: Array<string | false | undefined>): string => {
  return classes.filter(Boolean).join(' ')
}

export const objectFromEntries = <T, T2 extends string>(entries: Array<[T2, T]>): Record<T2, T> => {
  return entries.reduce((res, cur) => {
    res[cur[0]] = cur[1]
    return res
  }, {} as Record<T2, T>)
}
