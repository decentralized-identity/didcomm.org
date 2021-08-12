import * as React from 'react'
import { graphql, PageProps } from 'gatsby'

import { Avatar } from '../../components/Avatar/Avatar'
import { Header } from '../../components/Header/Header'
import { Status } from '../../components/Status/Status'
import { Layout } from '../../components/Layout/Layout'
import { Tags } from '../../components/Tags/Tags'
import { Search } from '../../components/Search/Search'
import { cls } from '../../common/utils'
import { mdRemark, Props } from './Protocol.types'
import * as styles from './Protocol.module.scss'

const Protocol = ({ html, tags, licence, title, avatar, username, version, status }: Props) => (
  <main>
    <h1 className={styles.title}>
      {title}&nbsp;<span className={cls('font-footnote', styles.version)}>{version}</span>
    </h1>
    <div className="grid-3">
      <article className={styles.body}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <div className={styles.meta}>
        <div className={styles.metaContent}>
          <div className={cls('font-subheadline', styles.metaTitle)}>Status</div>
          <Status type={status} />
        </div>
        <div className={styles.metaContent}>
          <div className={cls('font-subheadline', styles.metaTitle)}>Hashtags</div>
          <Tags tags={tags} />
        </div>
        <div className={styles.metaContent}>
          <div className={cls('font-subheadline', styles.metaTitle)}>Author</div>
          <Avatar username={username} avatar={avatar} />
        </div>

        <div className="hide-mobile hide-print">
          <div className={styles.metaContent}>
            <div className={cls('font-subheadline', styles.metaTitle)}>Version</div>
            <div className="font-footnote">{version}</div>
          </div>
        </div>

        <div className={styles.metaContent}>
          <div className={cls('font-subheadline', styles.metaTitle)}>Licence</div>
          <div className="font-footnote">{licence}</div>
        </div>
      </div>
    </div>
  </main>
)

export const ProtocolTemplate = ({ data, navigate }: PageProps<mdRemark>) => {
  const {
    markdownRemark: { frontmatter, html, fields },
  } = data

  return (
    <Layout>
      <Header className="hide-print">
        <Search bordered onSearch={(query) => navigate(`/search/?q=${query}&page=1`)} />
      </Header>
      <div className="content">
        <Protocol {...frontmatter} html={html} {...fields} />
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
        licence
        username
        status
      }
      fields {
        avatar
        version
      }
    }
  }
`
