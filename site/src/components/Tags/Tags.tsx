import * as React from 'react'

import { Props } from './Tags.types'
import * as styles from './Tags.module.scss'

export const Tags = ({ tags }: Props) => {
  return (
    <div className={styles.tags}>
      {tags.map((tag) => (
        <span key={tag} className={styles.tag}>
          #&nbsp;{tag}
        </span>
      ))}
    </div>
  )
}
