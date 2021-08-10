import * as React from 'react'

import * as styles from './Pagination.module.scss'
import { cls } from '../../common/utils'

type Props = {
  pageCount: number
  currentPage: number
  setPage: (page: number) => void
  next: () => void
  hasNext: boolean
}

export const Pagination = ({ setPage, pageCount, currentPage, next, hasNext }: Props) => {
  const pages = getPages(pageCount, currentPage)
  return pageCount > 1 ? (
    <nav className={styles.pagination}>
      {hasNext && (
        <button onClick={next} className={cls('font-callout', styles.next)}>
          Next
        </button>
      )}
      <ul className={styles.pages}>
        {pages.map((page) => (
          <li key={page}>
            <button className={cls('font-callout', styles.page, page === currentPage && styles.current)} onClick={() => setPage(page)}>
              {page}
            </button>
          </li>
        ))}
      </ul>
      {pages[pages.length - 1] < pageCount && <div className={styles.ellipsis}>...</div>}
    </nav>
  ) : null
}

const getPages = (pageCount: number, curPage: number) => {
  let startPosition = Math.floor((curPage - 1) / 5) * 5
  if (pageCount - curPage < 5 && curPage > 5) {
    startPosition -= 5 - (pageCount - startPosition)
  }
  return Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1 + startPosition)
}
