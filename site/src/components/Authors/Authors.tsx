import * as React from 'react'

import { cls } from '../../common/utils'
import { Props } from './Authors.types'
import * as styles from './Authors.module.scss'

export const Authors = ({ authors }: Props) => (
  <div className={styles.authors}>
    {authors.map(({ name, email }) => email
      ? <a key={name + email} className={cls('font-footnote', styles.link)} href={`mailto:${email}`}>{name}</a>
      : <span key={name + email} className="font-footnote">{name}</span>)}
  </div>
)
