import { useEffect } from 'react'
import { NumberParam, useQueryParam } from 'use-query-params'
import { ITEMS_PER_PAGE } from '../constants'

export type Pagination<TItem> = {
  next: () => void
  pagesCount: number
  prev: () => void
  hasNext: boolean
  items: TItem[]
  page: number
  setPage: (page: number) => void
}

export const usePagination = <TItem extends {}>(list: Array<TItem>): Pagination<TItem> => {
  const [page, setPage] = useQueryParam('page', NumberParam)

  let fallbackPage = page ?? 1

  useEffect(() => {
    if (page === undefined) {
      setPage(1, 'replaceIn')
    }
  }, [list])

  const items = list.slice((fallbackPage - 1) * ITEMS_PER_PAGE, fallbackPage * ITEMS_PER_PAGE)
  const next = () => setPage(fallbackPage + 1)
  const prev = () => setPage(fallbackPage - 1)
  const hasNext = list.length > fallbackPage * ITEMS_PER_PAGE
  const pagesCount = Math.ceil(list.length / ITEMS_PER_PAGE)

  return {
    hasNext,
    next,
    prev,
    items,
    pagesCount,
    setPage,
    page: fallbackPage,
  }
}
