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

export const usePagination = <TItem extends {}>(
  list: Array<TItem>,
): Pagination<TItem> => {
  const [page, setPage] = useQueryParam('page', NumberParam)

  useEffect(() => {
    if (page === undefined) {
      setPage(1, 'replaceIn')
    }
  }, [list])

  const items = list.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const next = () => setPage(page + 1)
  const prev = () => setPage(page - 1)
  const hasNext = list.length > page * ITEMS_PER_PAGE
  const pagesCount = Math.ceil(list.length / ITEMS_PER_PAGE)

  return {
    hasNext,
    next,
    prev,
    items,
    pagesCount,
    setPage,
    page,
  }
}
