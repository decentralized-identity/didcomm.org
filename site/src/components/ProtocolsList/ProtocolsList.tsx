import { Link } from 'gatsby'
import * as React from 'react'
import { usePagination } from '../../common/hooks/usePagination'
import { Pagination } from '../Pagination/Pagination'
import { Protocol } from '../../common/types'

type Props = {
  protocols: Protocol[]
}

export const ProtocolsList = ({ protocols }: Props) => {
  const {items: paginatedProtocols, setPage, pagesCount} = usePagination(protocols)

  return (
    <>
      <ul>
        {paginatedProtocols.map(protocol => (
          <li key={protocol.slug}><Link to={`/${protocol.slug}`}>{protocol.title}</Link></li>
        ))}
      </ul>
      <Pagination pageCount={pagesCount} setPage={setPage} />
    </>
  )
}
