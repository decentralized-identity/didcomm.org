import * as React from 'react'

import { Props } from './Tags.types'
import * as styles from './Tags.module.scss'
import { Link } from 'gatsby'

export const Tags = ({ tags }: Props) => {
  return (
    <div className={styles.tags}>
      {tags.map((tag) => (
        <Link to={`/search?tag=${tag}`} key={tag} className={styles.tag}>
          #&nbsp;{tag}
        </Link>
      ))}
    </div>
  )
}
