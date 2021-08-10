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
    username: string
    summary: string
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
  username: string
  avatar: string
  modifiedTime: string
  summary: string
}
