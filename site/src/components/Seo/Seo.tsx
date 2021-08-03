import * as React from 'react'
import { Helmet } from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'

type Meta = {
  content: string
  name: string
}

type Props = {
  description?: string
  meta?: Meta[]
  title?: string
}

interface QueryData {
  site: {
    siteMetadata: {
      title: string
      description: string
    }
  }
}

export const Seo = ({ description, meta = [], title }: Props) => {
  const { site } = useStaticQuery<QueryData>(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
          }
        }
      }
    `,
  )

  const metaDescription = description || site.siteMetadata.description

  return (
    <Helmet
      htmlAttributes={{
        lang: 'en',
      }}
      title={title}
      defaultTitle={site.siteMetadata.title}
      titleTemplate={`%s | ${site.siteMetadata.title}`}
      meta={[
        {
          name: `description`,
          content: metaDescription,
        },
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:description`,
          content: metaDescription,
        },
        {
          property: `og:type`,
          content: `website`,
        },
      ].concat(meta)}
    >
    </Helmet>
  )
}
