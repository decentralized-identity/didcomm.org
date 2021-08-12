export type Meta = {
  content: string
  name: string
}

export type Props = {
  description?: string
  meta?: Meta[]
  title?: string
}

export type QueryData = {
  site: {
    siteMetadata: {
      title: string
      description: string
    }
  }
}
