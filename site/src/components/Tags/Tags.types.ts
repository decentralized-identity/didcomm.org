export type Tag = string

export type Props = {
  tags: Array<Tag>
  onClick?: (tag: string) => void
}
