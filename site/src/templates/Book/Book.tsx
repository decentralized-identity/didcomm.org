import * as React from 'react'
import { graphql, PageProps, navigate } from 'gatsby'

import { Header } from '../../components/Header/Header'
import { Status } from '../../components/Status/Status'
import { Layout } from '../../components/Layout/Layout'
import { cls } from '../../common/utils'
import { mdRemark, PageContext, Props } from './Book.types'
import * as styles from './Book.module.scss'

const Book = ({ html }: Props) => (
  <main>
    <div className="grid-3">
      <article className={styles.body} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  </main>
)

export const BookTemplate = ({ data, pageContext }: PageProps<mdRemark, PageContext>) => {
  const {
    markdownRemark: { },
  } = data

  return (
    <Layout>
      <div className="content">
        <Book html={pageContext.html} />
      </div>
    </Layout>
  )
}

export default BookTemplate

export const query = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
    }
  }
`
