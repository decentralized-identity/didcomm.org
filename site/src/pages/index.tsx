import * as React from 'react'
import { graphql, Link, PageProps } from 'gatsby'

import { Layout } from '../components/Layout/Layout'
import { Header } from '../components/Header/Header'
import { Search } from '../components/Search/Search'
import { AllMarkdownRemark } from '../common/types'

type QueryData = {
  protocols: AllMarkdownRemark<{
    fields: {
      slug: string
    }
  }>
}

const IndexPage = ({ data: { protocols } }: PageProps<QueryData>) => (
  <Layout>
    <Header />
    <h1>Find and publish decentralized protocols built atop DIDComm</h1>
    <main>
      <section>
        <Search />
      </section>
      <section>
        <Link to="search">Browse all protocols</Link>
      </section>
      <section>
        {protocols.nodes.length > 0 && 'Recently added'}
        <ul>{protocols.nodes?.map(({ fields: { slug } }) => <li>{slug}</li>)}</ul>
      </section>
    </main>
  </Layout>
)

export const query = graphql`
  {
    protocols: allMarkdownRemark(filter: { fields: { collection: { eq: "protocols" } } }, limit: 5) {
      nodes {
        fields {
          slug
        }
      }
    }
  }
`

export default IndexPage
