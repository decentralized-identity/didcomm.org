export const cls = (...classes: (string | false | undefined)[]): string => {
  return classes.filter(Boolean).join(' ')
}
