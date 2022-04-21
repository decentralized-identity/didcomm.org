const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { Octokit } = require('@octokit/core')
const octokit = new Octokit()
const gitDateExtractor = require('git-date-extractor')
const { stripHtml } = require('string-strip-html')
const { sanitizer } = require('./sanitizer')
// TODO move all exports to separate files

let protocolDatesCache = {}
exports.onPreBootstrap = async () => {
  protocolDatesCache = await gitDateExtractor.getStamps({ onlyIn: 'content/protocols' })
}

module.exports.onCreateNode = async ({ node, actions, getNode }) => {
  if (node.internal.type === 'MarkdownRemark') {
    const fileNode = getNode(node.parent)
    const parsedFilePath = path.parse(fileNode.relativePath)
    const { sourceInstanceName } = fileNode
    if (sourceInstanceName === 'book') {
        actions.createNodeField({
            name: 'collection',
            node,
            value: sourceInstanceName,
        })
        let slug = `book/${parsedFilePath.dir}/${parsedFilePath.name}`
        if (parsedFilePath.name == 'README') {
            slug = `book/v2/`
        }
        actions.createNodeField({
                name: 'slug',
                node,
                value: slug,
        })
    } else if (sourceInstanceName === 'protocols') {
      const [protocolName, protocolVersion] = parsedFilePath.dir.split('/')
      const slug = `${protocolName}/${protocolVersion}/`

      let avatar = ''
      try {
        const response = await octokit.request('GET /users/{username}', {
          username: node.frontmatter.publisher,
        })

        if (response.status >= 400) {
          console.error(`Can't fetch avatar for username: ${node.frontmatter.publisher}. Server responded with status: ${response.status}.`)
        } else {
          avatar = `${response.data.avatar_url}&s=48`
        }
      } catch (e) {
        console.error(`Can't fetch avatar for username: ${node.frontmatter.publisher}. Server is not available.`)
      }

      const date = protocolDatesCache[`content/protocols/${slug}readme.md`]

      actions.createNodeField({
        name: 'slug',
        node,
        value: slug,
      })

      actions.createNodeField({
        name: 'collection',
        node,
        value: sourceInstanceName,
      })

      actions.createNodeField({
        name: 'version',
        node,
        value: protocolVersion,
      })

      actions.createNodeField({
        name: 'avatar',
        node,
        value: avatar,
      })

      actions.createNodeField({
        name: 'modifiedDate',
        node,
        value: new Date(date.modified * 1000),
      })
    }
  }
}

module.exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  const typeDefs = `
  type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }
    type Frontmatter {
      title: String
      tags: [String]
      license: String
      publisher: String
      status: String
      piuri: String
      summary: String
      authors: [Author]
    }
    type Fields {
      collection: String
      slug: String
      version: String
      avatar: String
      modifiedDate: Date
    }
    type Author {
      name: String
      email: String
    }
  `
  createTypes(typeDefs)
}

module.exports.createPages = async ({ actions, graphql }) => {
  const allMarkdown = await graphql(`
    {
      books: allMarkdownRemark(
        filter: { fields: { collection: { eq: "book" } } }
      ) {
        nodes {
          id
          html
          fields {
              slug
          }
        }
      }
      protocols: allMarkdownRemark(
        filter: { fields: { collection: { eq: "protocols" } } }
        sort: { order: ASC, fields: frontmatter___title }
      ) {
        nodes {
          id
          html
          fields {
            slug
            version
            avatar
            modifiedDate
          }
          frontmatter {
            title
            tags
            license
            publisher
            status
            summary
            piuri
          }
        }
      }
    }
  `)
  if (allMarkdown.errors) {
    allMarkdown.errors.forEach((e) => console.error(e.toString()))
    throw Error(allMarkdown.errors)
  }

  const protocolTemplate = path.resolve(`src/templates/Protocol/Protocol.tsx`)
  const pages = allMarkdown.data.protocols.nodes
  pages.forEach((page) => {
    const { id, fields, html } = page

    let matchPath = fields.slug + '*'
    actions.createPage({
      path: fields.slug,
      matchPath: matchPath,
      component: protocolTemplate,
      context: {
        id,
        html: sanitizer(html),
      },
    })
  })

  const bookTemplate = path.resolve(`src/templates/Book/Book.tsx`)
  const bookPages = allMarkdown.data.books.nodes
  bookPages.forEach((page) => {
    const { id, fields, html } = page
    actions.createPage({
      path: fields.slug,
      component: bookTemplate,
      context: {
        id,
        html: sanitizer(html),
      },
    })
  })

  createSearchPage(actions.createPage, allMarkdown.data.protocols.nodes)
}

const createSearchPage = (createPage, protocols) => {
  const normalizedProtocols = protocols.map((node) => ({
    slug: node.fields.slug,
    title: node.frontmatter.title,
    tags: node.frontmatter.tags,
    license: node.frontmatter.license,
    publisher: node.frontmatter.publisher,
    avatar: node.fields.avatar,
    version: node.fields.version,
    status: node.frontmatter.status,
    summary: node.frontmatter.summary,
    modifiedDate: node.fields.modifiedDate,
    piuri: node.frontmatter.piuri,
    html: stripHtml(node.html).result,
  }))
  const allLicenses = Array.from(new Set(normalizedProtocols.map(({ license }) => license)))
  const searchComponent = path.resolve('src/templates/Search/Search.tsx')
  createPage({
    path: '/search/',
    component: searchComponent,
    context: {
      allProtocols: normalizedProtocols,
      allLicenses,
    },
  })
}

module.exports.onCreateWebpackConfig = ({ stage, actions, getConfig }) => {
  // https://github.com/gatsbyjs/gatsby/discussions/30169
  if (stage === 'build-javascript' || stage === 'develop') {
    const config = getConfig()
    const index = config.plugins.findIndex((plugin) => plugin.constructor.name === 'MiniCssExtractPlugin')
    if (index === -1) {
      return
    }
    config.plugins[index] = new MiniCssExtractPlugin({ ignoreOrder: true })
    actions.replaceWebpackConfig(config)
  }
}
