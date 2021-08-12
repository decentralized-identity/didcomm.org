import * as React from 'react'

type Props = {
  pageCount: number
  setPage: (page: number) => void
}

export const Pagination = ({ setPage, pageCount }: Props) => (
  pageCount > 1
    ? (
      <nav>
        <ul>
          {getPages(pageCount).map(page => (
            <li key={page}>
              <button onClick={() => setPage(page)}>{page}</button>
            </li>
          ))}
        </ul>
      </nav>
    )
    : null
)


const getPages = (pageCount: number) => (Array.from({ length: pageCount }, (_, i) => i + 1))
