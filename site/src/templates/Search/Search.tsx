import * as React from 'react'
import { useMemo } from 'react'
import { PageProps } from 'gatsby'
import { ArrayParam, DateParam, StringParam, useQueryParams, withDefault } from 'use-query-params'

import { filter, useProtocolsSearch } from '../../common/hooks/useProtocolsSearch'
import { Header } from '../../components/Header/Header'
import { Layout } from '../../components/Layout/Layout'
import { ProtocolsList } from '../../components/ProtocolsList/ProtocolsList'
import { Search as SearchComponent } from '../../components/Search/Search'
import { PageContext } from './Search.types'
import * as styles from './Search.module.scss'
import { Filters } from '../../components/Filters/Filters'
import { Chips } from '../../components/Chips/Chips'
import { Icons } from '../../components/SvgIcon/SvgIcon.types'
import { logs } from 'gatsby/dist/redux/reducers'

const Search = ({ pageContext }: PageProps<{}, PageContext>) => {
  // const [query, setQuery] = useQueryParam('q', StringParam)
  const [params, setParams] = useQueryParams({
    status: withDefault(ArrayParam, []),
    license: withDefault(ArrayParam, []),
    q: StringParam,
    date: DateParam,
  })

  const filteredProtocols = useMemo(() => filter(pageContext.allProtocols, {statuses: params.status,licenses: params.license, date: params.date }), [params.status, params.date, params.license])
  const { protocols, loading } = useProtocolsSearch(filteredProtocols, params.q, [params.q, filteredProtocols])
  const dropFilter = (filterName: keyof typeof params, filter?: string) => {
    if (filterName === 'date' && !filter) {
      setParams({...params, date: null})
      return
    }
    setParams({...params, [filterName]: params[filterName as 'status' | 'license'].filter(f => f !== filter)})
  }
  return (
    <Layout primary title={params.q ? `${params.q} - search` : 'Browse All'}>
      <Header>
        <SearchComponent bordered query={params.q} onSearch={(q) => setParams({... params, q}, 'push')} />
      </Header>
      <div className="content">
        <h1 className={styles.title}>
          <mark className={styles.mark}>{(params.q || params.license.length || params.status.length) ? protocols.length : 'All'}</mark>{' '}
          {(params.q || params.license.length || params.status.length) && protocols.length === 1 ? 'protocol' : 'protocols'} {(params.q || params.license.length || params.status.length ) ? `found ${ params.q ? `for "${params.q}"` : ''}` : ''}
        </h1>
        <div className="grid-3">
          <main className={styles.main}>
            <div style={{display: 'flex', flexWrap: 'wrap'}}>
              {params.license?.map(l => <Chips content={`License: ${l}`} actionIcon={Icons.cross} action={() => dropFilter('license', l)} key={l} /> )}
              {params.status?.map(s => <Chips content={`Status: ${s}`} actionIcon={Icons.cross} action={() => dropFilter('status', s)} key={s} /> )}
              {params.date && <Chips content={`Date: ${params.date}`} actionIcon={Icons.cross} action={() => dropFilter('date')} />}
            </div>
            {loading ? 'Loading...' : <ProtocolsList protocols={protocols} />}
          </main>
          <aside className="hide-mobile">
            {/* TODO filters */}
            <Filters alllicences={Array.from(new Set(pageContext.allProtocols.map(p => p.license)))} licences={params.license} status={params.status as any} onFilters={v => {

              return setParams(({...params, ...v}), 'push')
            }} />
          </aside>
        </div>
      </div>
    </Layout>
  )
}

export default Search
