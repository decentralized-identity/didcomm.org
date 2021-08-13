export type AllMarkdownRemark<TNode> = {
  nodes: TNode[]
}
export const Status = {
  Proposed: 'proposed',
  Demonstrated: 'demonstrated',
  Production: 'production',
}

export type StatusType = keyof typeof Status

export type MDProtocol = {
  fields: {
    slug: string
    version: string
    avatar: string
    modifiedTime: string
  }
  frontmatter: {
    tags: string[]
    title: string
    licence: string
    status: StatusType
    publisher: string
    summary: string
    piuri: string
  }
  html: string
}

export type Protocol = {
  slug: string
  tags: string[]
  title: string
  licence: string
  html: string
  version: string
  status: StatusType
  publisher: string
  avatar: string
  modifiedTime: string
  summary: string
  piuri: string
}
