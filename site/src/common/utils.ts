import { Filters, Protocol } from './types'
import dayjs from 'dayjs'

export const cls = (...classes: Array<string | false | undefined>): string => {
  return classes.filter(Boolean).join(' ') || undefined
}

export const objectFromEntries = <T, T2 extends string>(entries: Array<[T2, T]>): Record<T2, T> => {
  return entries.reduce((res, cur) => {
    res[cur[0]] = cur[1]
    return res
  }, {} as Record<T2, T>)
}

export enum formatDateUnit {
  year = 'This year',
  month = 'This month',
  week = 'This week',
  day = 'Today',
}

export const noScroll = (on: boolean) => (on ? document.body.classList.add('no-scroll') : document.body.classList.remove('no-scroll'))

export const applyFilters = (protocols: Array<Protocol>, filters: Filters) =>
  protocols.filter((protocol: Protocol) => {
    let pass = true

    if (filters.status.length !== 0) {
      pass = filters.status.includes(protocol.status)
    }

    if (pass && filters.license.length !== 0) {
      pass = filters.license.includes(protocol.license)
    }

    if (pass && filters.dateUnit) {
      pass = dayjs().subtract(1, filters.dateUnit).isBefore(protocol.modifiedDate)
    }

    if (pass && filters.tag.length !== 0) {
      pass = filters.tag.some((t) => protocol.tags.includes(t))
    }

    return pass
  })
