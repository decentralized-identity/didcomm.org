export type AllMarkdownRemark<TNode> = {
  nodes: TNode[]
}
export const Status = {
  Proposed: 'proposed',
  Demonstrated: 'demonstrated',
  Production: 'production',
} as const

export type StatusType = keyof typeof Status

export enum DateUnit {
  year = 'year',
  month = 'month',
  week = 'week',
  day = 'day',
}

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

export type Filters = {
  status: Array<string>
  license: Array<string>
  dateUnit: DateUnit
  tag: Array<string>
}
