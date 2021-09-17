import * as React from 'react'
import { graphql, PageProps, navigate } from 'gatsby'

import { Avatar } from '../../components/Avatar/Avatar'
import { Header } from '../../components/Header/Header'
import { Status } from '../../components/Status/Status'
import { Layout } from '../../components/Layout/Layout'
import { Tags } from '../../components/Tags/Tags'
import { Search } from '../../components/Search/Search'
import { cls } from '../../common/utils'
import { mdRemark, PageContext, Props } from './Protocol.types'
import * as styles from './Protocol.module.scss'
import { LastModified } from '../../components/LastModified/LastModified'
import { Authors } from '../../components/Authors/Authors'

const Protocol = ({ html, tags, license, title, avatar, publisher, version, status, piuri, summary, modifiedDate, authors }: Props) => (
  <main>
    <h1 className={cls('font-title-1', styles.title)}>
      {title}&nbsp;<span className={cls('font-footnote', styles.version)}>{version}</span>
    </h1>
    <div className="grid-3">
      <article className={styles.body}>
        <h2>Summary</h2>
        <p>{summary}</p>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <div className={styles.meta}>
        <div className={styles.metaContent}>
          <div className={cls('font-subheadline', styles.metaTitle)}>PIURI</div>
          <div className="font-footnote">{piuri}</div>
        </div>
        <div className={styles.metaContent}>
          <div className={cls('font-subheadline', styles.metaTitle)}>Status</div>
          <Status type={status} />
        </div>
        <div className={styles.metaContent}>
          <div className={cls('font-subheadline', styles.metaTitle)}>Hashtags</div>
          <Tags tags={tags} />
        </div>
        <div className={styles.metaContent}>
          <div className={cls('font-subheadline', styles.metaTitle)}>Publisher</div>
          <Avatar publisher={publisher} avatar={avatar} />
        </div>
        <div className={styles.metaContent}>
          <div className={cls('font-subheadline', styles.metaTitle)}>Authors</div>
          <Authors authors={authors} />
        </div>
        <div className="hide-mobile hide-print">
          <div className={styles.metaContent}>
            <div className={cls('font-subheadline', styles.metaTitle)}>Version</div>
            <div className="font-footnote">{version}</div>
          </div>
        </div>
        <div className={styles.metaContent}>
          <div className={cls('font-subheadline', styles.metaTitle)}>License</div>
          <div className="font-footnote">{license}</div>
        </div>
        <div className={styles.metaContent}>
          <div className={cls('font-subheadline', styles.metaTitle)}>Last modified</div>
          <LastModified className="font-footnote" lastModified={modifiedDate} />
        </div>
      </div>
    </div>
  </main>
)

export const ProtocolTemplate = ({ data, pageContext }: PageProps<mdRemark, PageContext>) => {
  const {
    markdownRemark: { frontmatter, fields },
  } = data

  return (
    <Layout title={frontmatter.title}>
      <Header className="hide-print">
        <Search bordered onSearch={(query) => navigate(`/search/?q=${encodeURIComponent(query)}&page=1`)} />
      </Header>
      <div className="content">
        <Protocol {...frontmatter} html={pageContext.html} {...fields} />
      </div>
    </Layout>
  )
}

export default ProtocolTemplate

export const query = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
        tags
        license
        publisher
        status
        piuri
        summary
        authors {
          name
          email
        }
      }
      fields {
        modifiedDate
        avatar
        version
      }
    }
  }
`
