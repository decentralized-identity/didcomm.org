import * as React from 'react'
import { usePagination } from '../../common/hooks/usePagination'
import { Pagination } from '../Pagination/Pagination'
import { Protocol } from '../../common/types'
import { ProtocolsListItem } from './ProtocolsListItem/ProtocolsListItem'
import * as styles from './ProtocolsList.module.scss'

type Props = {
  protocols: Protocol[]
}

export const ProtocolsList = ({ protocols }: Props) => {
  const { items: paginatedProtocols, setPage, pagesCount, page, next, hasNext } = usePagination(protocols)
  return (
    <>
      <ul className={styles.list}>
        {paginatedProtocols.map((protocol) => (
          <li key={protocol.slug}>
            <ProtocolsListItem protocol={protocol} />
          </li>
        ))}
      </ul>
      <Pagination hasNext={hasNext} next={next} currentPage={page} pageCount={pagesCount} setPage={setPage} />
    </>
  )
}
