const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { Octokit } = require('@octokit/core')
const octokit = new Octokit()

// TODO move all exports to separate files

module.exports.onCreateNode = async ({ node, actions, getNode }) => {
  if (node.internal.type === 'MarkdownRemark') {
    const fileNode = getNode(node.parent)
    const parsedFilePath = path.parse(fileNode.relativePath)
    const { sourceInstanceName } = fileNode

    if (sourceInstanceName === 'protocols') {
      const [protocolName, protocolVersion] = parsedFilePath.dir.split('/')
      const slug = `${protocolName}/${protocolVersion}/`

      let avatar = ''
      try {
        const response = await octokit.request('GET /users/{username}', {
          username: node.frontmatter.username,
        })
        if (response.status >= 400) {
          throw new Error()
        }
        avatar = `${response.data.avatar_url}&s=48`
      } catch (e) {
        console.error(`Can't fetch avatar for username: ${node.frontmatter.username}`)
      }

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
        name: 'modifiedTime',
        node,
        value: new Date(fileNode.modifiedTime),
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
      licence: String
      username: String
      status: String
    }
    type Fields {
      collection: String
      slug: String
      version: String
      avatar: String
      modifiedTime: Date
    }
  `
  createTypes(typeDefs)
}

module.exports.createPages = async ({ actions, graphql }) => {
  const allMarkdown = await graphql(`
    {
      protocols: allMarkdownRemark(filter: { fields: { collection: { eq: "protocols" } } }) {
        nodes {
          id
          fields {
            slug
            version
            avatar
            modifiedTime
          }
          frontmatter {
            title
            tags
            licence
            username
            status
            summary
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
    const { id, fields } = page

    actions.createPage({
      path: fields.slug,
      component: protocolTemplate,
      context: { id },
    })
  })

  createSearchPage(actions.createPage, allMarkdown.data.protocols.nodes)
}

const createSearchPage = (createPage, protocols) => {
  const normalizedProtocols = protocols.map((node) => ({
    slug: node.fields.slug,
    title: node.frontmatter.title,
    tags: node.frontmatter.tags,
    licence: node.frontmatter.licence,
    username: node.frontmatter.username,
    avatar: node.fields.avatar,
    version: node.fields.version,
    status: node.frontmatter.status,
    summary: node.frontmatter.summary,
    modifiedTime: node.fields.modifiedTime,
  }))
  const allLicences = Array.from(new Set(normalizedProtocols.map(({ licence }) => licence)))
  const searchComponent = path.resolve('src/templates/Search/Search.tsx')
  createPage({
    path: '/search/',
    component: searchComponent,
    context: {
      allProtocols: normalizedProtocols,
      allLicences,
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
