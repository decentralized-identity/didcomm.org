const path = require('path')

// TODO move all exports to separate files 

module.exports.onCreateNode = ({ node, actions, getNode }) => {
  if (node.internal.type === 'MarkdownRemark') {
    const fileNode = getNode(node.parent)
    const parsedFilePath = path.parse(fileNode.relativePath)
    const { sourceInstanceName } = fileNode

    if (sourceInstanceName === 'protocols') {
      const [protocolName, protocolVersion] = parsedFilePath.dir.split('/')
      const slug = `${protocolName}/${protocolVersion}/`

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
    }
  }
}

module.exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  // TODO add Frontmatter types (title, tags etc)
  const typeDefs = `
    type MarkdownRemark implements Node @dontInfer {
        fields: MarkdownRemarkFields
        frontmatter: MarkdownRemarkFrontmatter
    }
    type MarkdownRemarkFrontmatter {
      title: String
      keywords: [String]
      licence: String
    }
    type MarkdownRemarkFields {
      collection: String
      slug: String
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
        }
        frontmatter {
          title
          keywords
          licence
        }
      }
    } 
  }
  `)
  if (allMarkdown.errors) {
    allMarkdown.errors.forEach((e) => console.error(e.toString()))
    throw Error(allMarkdown.errors)
  }

  const protocolTemplate = path.resolve(`src/templates/Protocol.tsx`)
  const pages = allMarkdown.data.protocols.nodes
  pages.forEach(page => {
    const { id, fields } = page
    console.log('created ' + fields.slug)
    actions.createPage({
      path: fields.slug,
      component: protocolTemplate,
      context: { id },
    })
  })

  createSearchPage(actions.createPage, allMarkdown.data.protocols.nodes)
}

const normalizeProtocol = (node) => ({
  slug: node.fields.slug,
  title: node.frontmatter.title,
  keywords: node.frontmatter.keywords,
  licence: node.frontmatter.licence,
})

const createSearchPage = (createPage, protocols) => {
  const normalizedProtocols = protocols.map(normalizeProtocol)
  const searchComponent = path.resolve('src/templates/Search.tsx')
  createPage({
    path: '/search/',
    component: searchComponent,
    context: {
      allProtocols: normalizedProtocols,
    },
  })
}
