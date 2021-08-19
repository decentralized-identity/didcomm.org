import * as React from 'react'
import { GITHUB_URL } from '../../common/constants'
import { cls } from '../../common/utils'
import { Props } from './Avatar.types'
import * as styles from './Avatar.module.scss'

export const Avatar = ({ publisher, avatar }: Props) => {
  return (
    <a
      rel="noreferrer noopener nofollow"
      aria-label={`GitHub profile ${publisher}`}
      className={styles.avatar}
      target="_blank"
      href={`${GITHUB_URL}/${publisher}`}
    >
      <div style={{ backgroundImage: `url(${avatar})` }} className={cls(styles.img, 'font-footnote')} />
      <span className={cls('font-footnote', styles.publisher)}>@{publisher}</span>
    </a>
  )
}
