export type AllMarkdownRemark<TNode> = {
  nodes: TNode[]
}

export type MDProtocol = {
  fields: {
    slug: string
  }
  frontmatter: {
    keywords: string[]
    title: string
    licence: string
  }
  html: string
}

export type Protocol = {
  slug: string
  keywords: string[]
  title: string
  licence: string
  html: string
}
