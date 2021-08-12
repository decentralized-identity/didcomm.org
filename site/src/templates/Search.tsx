import * as React from 'react'
import { PageProps } from 'gatsby'
import { Layout } from '../components/Layout/Layout'
import { Header } from '../components/Header/Header'
import { useProtocolsSearch } from '../common/hooks/useProtocolsSearch'
import { ProtocolsList } from '../components/ProtocolsList/ProtocolsList'
import { Search as SearchComponent } from '../components/Search/Search'
import { useQueryParam, StringParam } from 'use-query-params'
import { Protocol } from '../common/types'

type PageContext = {
  allProtocols: Protocol[]
}

const filter = (filter) => {

}

const Search = ({ pageContext }: PageProps<{}, PageContext>) => {
  const [query, setQuery] = useQueryParam('q', StringParam)
  const { protocols, loading } = useProtocolsSearch(pageContext.allProtocols, query)

  return (
    <Layout>
      <Header>
        <SearchComponent query={query} onSearch={setQuery} />
      </Header>
      <main>
        <h1>Protocols Definition</h1>
        <section>
          {loading
            ? 'Loading...'
            : <ProtocolsList protocols={protocols} />
          }
        </section>
      </main>
    </Layout>
  )
}
export default Search
