const path = require('path')

module.exports.onCreateNode = ({ node, actions, getNode }) => {
  if (node.internal.type === 'MarkdownRemark') {
    const fileNode = getNode(node.parent)
    const parsedFilePath = path.parse(fileNode.relativePath)
    const { sourceInstanceName } = fileNode

    if (sourceInstanceName === 'protocols') {
      const protocolName = parsedFilePath.dir
      const protocolVersion = parsedFilePath.name
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
    }
 
    type MarkdownRemarkFields {
      collection: String
      slug: String
    }
  `
  createTypes(typeDefs)
}
