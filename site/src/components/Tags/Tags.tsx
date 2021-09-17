import * as React from 'react'

import { Props } from './Tags.types'
import * as styles from './Tags.module.scss'
import { Link } from 'gatsby'

export const Tags = ({ tags, onClick }: Props) => {
  const onTagClick = (tag: string) => (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    onClick(tag)
  }

  return (
    <div className={styles.tags}>
      {tags.map((tag) => (
        <Link to={`/search?tag=${tag}`} onClick={onClick ? onTagClick(tag) : undefined} key={tag} className={styles.tag}>
          #&nbsp;{tag}
        </Link>
      ))}
    </div>
  )
}
