import * as React from 'react'
import * as styles from './Tags.module.scss'
type Props = {
  tags: Array<Tag>
}

export const Tags = ({ tags }: Props) => {
  return (
    <div className={styles.tags}>
      {tags.map((tag) => (
        <span key={tag} className={styles.tag}>
          # {tag}
        </span>
      ))}
    </div>
  )
}

export type Tag = string
