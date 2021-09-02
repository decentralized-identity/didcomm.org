import * as React from 'react'

import { cls } from '../../common/utils'
import { getPages } from './utils'
import { Props } from './Pagination.types'
import * as styles from './Pagination.module.scss'

export const Pagination = ({ setPage, pageCount, currentPage, next, hasNext }: Props) => {
  const pages = getPages(pageCount, currentPage)
  return pageCount > 1 ? (
    <nav aria-label="pagination" className={styles.pagination}>
      {hasNext && (
        <button onClick={next} className={cls('font-callout', styles.next)}>
          Next
        </button>
      )}
      <ul className={styles.pages}>
        {pages.map((page) => (
          <li key={page}>
            <button
              aria-current={page === currentPage ? 'page' : undefined}
              disabled={page === currentPage}
              className={cls('font-callout', styles.page, page === currentPage && styles.current)}
              onClick={() => setPage(page)}
            >
              <span className="visually-hidden">page </span> {page}
            </button>
          </li>
        ))}
      </ul>
      {pages[pages.length - 1] < pageCount && <div className={styles.ellipsis}>...</div>}
    </nav>
  ) : null
}
