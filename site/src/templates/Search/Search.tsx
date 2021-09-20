import * as React from 'react'
import { useMemo, useRef, useState } from 'react'
import { PageProps } from 'gatsby'
import { ArrayParam, StringParam, useQueryParams, withDefault } from 'use-query-params'

import { useProtocolsSearch } from '../../common/hooks/useProtocolsSearch'
import { Header } from '../../components/Header/Header'
import { Layout } from '../../components/Layout/Layout'
import { ProtocolsList } from '../../components/ProtocolsList/ProtocolsList'
import { Search as SearchComponent } from '../../components/Search/Search'
import { PageContext } from './Search.types'
import { Filters } from '../../components/Filters/Filters'
import { Chips } from '../../components/Chips/Chips'
import { Icons } from '../../components/SvgIcon/SvgIcon.types'
import { applyFilters, cls, formatDateUnit, noScroll } from '../../common/utils'
import { Button } from '../../components/Button/Button'
import { SvgIcon } from '../../components/SvgIcon/SvgIcon'
import { DateUnit, Filters as FiltersType } from '../../common/types'
import * as styles from './Search.module.scss'

const getProtocolsTitle = (filters: FiltersType, q: string, count: number): { prefix: string | number; title: string } => {
  const hasFilters = Boolean(filters.license.length || filters.status.length || filters.tag.length || filters.dateUnit)
  return {
    prefix: q || hasFilters ? count : 'All',
    title: `${count === 1 ? 'protocol' : 'protocols'} ${q || hasFilters ? 'found' : ''} ${q ? `for "${q}"` : ''}`,
  }
}

const Search = ({ pageContext }: PageProps<{}, PageContext>) => {
  const [params, setParams] = useQueryParams({
    status: withDefault(ArrayParam, []),
    license: withDefault(ArrayParam, []),
    tag: withDefault(ArrayParam, []),
    q: StringParam,
    date: StringParam,
  })

  const [showModal, _setShowModal] = useState(false)

  const addTagFilter = (tag: string) => {
    if (params.tag.includes(tag)) {
      return
    }
    setParams({
      ...params,
      tag: [...params.tag, tag],
    }, 'push')
  }

  const setShowModal = (value: boolean) => {
    noScroll(value)
    _setShowModal(value)
    let callback
    if (value) {
      callback = () => closeModalRef.current?.focus()
    } else {
      callback = () => openModalRef.current?.focus()
    }
    setTimeout(callback)
  }

  const closeModalRef = useRef<HTMLButtonElement>()
  const openModalRef = useRef<HTMLButtonElement>()

  const filteredProtocols = useMemo(
    () =>
      applyFilters(pageContext.allProtocols, {
        status: params.status,
        license: params.license,
        dateUnit: params.date as DateUnit,
        tag: params.tag,
      }),
    [params.status, params.date, params.license, params.tag],
  )

  const { protocols, loading } = useProtocolsSearch(filteredProtocols, params.q, [params.q, filteredProtocols])

  const dropFilter = (filterName: keyof typeof params, filter?: string) => {
    if (filterName === 'date' && !filter) {
      setParams({ ...params, date: undefined })
      return
    }
    setParams({ ...params, [filterName]: params[filterName as 'status' | 'license' | 'tag'].filter((f) => f !== filter) })
  }
  const title = getProtocolsTitle({ ...params, dateUnit: params.date as DateUnit }, params.q, protocols.length)

  return (
    <Layout primary title="Browse Protocols">
      <Header>
        <SearchComponent bordered query={params.q} onSearch={(q) => setParams({ ...params, q }, 'push')} />
      </Header>
      <div className="content">
        <h1 className={styles.title}>
          <mark className={styles.mark}>{title.prefix}</mark> {title.title}
        </h1>
        <div className="grid-3">
          <main className={styles.main}>
            <div className="hide-desktop">
              <Button ref={openModalRef} primary className={styles.showFilters} onClick={() => setShowModal(true)} icon={Icons.filter}>
                Filters
              </Button>
            </div>
            <div className={styles.chipsContainer}>
              {params.license?.map((l) => (
                <Chips
                  className={styles.chips}
                  content={`License: ${l}`}
                  actionIcon={Icons.cross}
                  action={() => dropFilter('license', l)}
                  key={l}
                />
              ))}
              {params.status?.map((s) => (
                <Chips
                  className={styles.chips}
                  content={`Status: ${s}`}
                  actionIcon={Icons.cross}
                  action={() => dropFilter('status', s)}
                  key={s}
                />
              ))}
              {params.tag?.map((t) => (
                <Chips
                  className={styles.chips}
                  content={`Tag: ${t}`}
                  actionIcon={Icons.cross}
                  action={() => dropFilter('tag', t)}
                  key={t}
                />
              ))}
              {params.date && (
                <Chips
                  className={styles.chips}
                  content={`Date: ${formatDateUnit[params.date]}`}
                  actionIcon={Icons.cross}
                  action={() => dropFilter('date')}
                />
              )}
            </div>
            {loading ? 'Loading...' : (
              <ProtocolsList onTagClick={addTagFilter} protocols={protocols} />
            )}
          </main>
          <aside aria-modal={showModal} role={showModal ? 'dialog' : undefined} className={cls('hide-mobile', showModal && styles.filters)}>
            <button ref={closeModalRef} className={cls(styles.close, 'hide-desktop')} onClick={() => setShowModal(false)}>
              <SvgIcon icon={Icons.cross} className={styles.closeIcon} />
              <span className="visually-hidden">Close</span>
            </button>
            <Filters
              date={params.date}
              allLicenses={pageContext.allLicenses}
              license={params.license}
              status={params.status}
              onFilters={(v) => {
                setShowModal(false)
                return setParams({ ...params, ...v }, 'push')
              }}
            />
          </aside>
        </div>
      </div>
    </Layout>
  )
}

export default Search
