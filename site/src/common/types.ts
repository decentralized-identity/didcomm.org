export type AllMarkdownRemark<TNode> = {
  nodes: TNode[]
}
export const Status = {
  Proposed: 'proposed',
  Demonstrated: 'demonstrated',
  Production: 'production',
}

export type StatusType = keyof typeof Status


export type Author = {
  name: string
  email?: string
}

export type MDProtocol = {
  fields: {
    slug: string
    version: string
    avatar: string
    modifiedDate: string
  }
  frontmatter: {
    tags: string[]
    title: string
    license: string
    status: StatusType
    publisher: string
    summary: string
    piuri: string
    authors: Array<Author>
  }
  html: string
}

export type Protocol = {
  slug: string
  tags: string[]
  title: string
  license: string
  html: string
  version: string
  status: StatusType
  publisher: string
  avatar: string
  modifiedDate: string
  summary: string
  piuri: string
  authors: Array<Author>
}
