import * as React from 'react'

import { Pagination } from '../Pagination/Pagination'
import { ProtocolsListItem } from './ProtocolsListItem/ProtocolsListItem'
import { usePagination } from '../../common/hooks/usePagination'
import { Props } from './ProtocolsList.types'
import * as styles from './ProtocolsList.module.scss'

export const ProtocolsList = ({ protocols }: Props) => {
  const { items: paginatedProtocols, setPage, pagesCount, page, next, hasNext } = usePagination(protocols)
  return (
    <div>
      <ul className={styles.list}>
        {paginatedProtocols.map((protocol) => (
          <li key={protocol.slug}>
            <ProtocolsListItem protocol={protocol} />
          </li>
        ))}
      </ul>
      <Pagination hasNext={hasNext} next={next} currentPage={page} pageCount={pagesCount} setPage={setPage} />
    </div>
  )
}
