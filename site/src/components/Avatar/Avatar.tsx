import * as React from 'react'
import { GITHUB_URL } from '../../common/constants'
import { cls } from '../../common/utils'
import { Props } from './Avatar.types'
import * as styles from './Avatar.module.scss'


export const Avatar = ({ username, avatar }: Props) => {
  return (
    <a rel="noreferrer noopener nofollow" className={styles.avatar} target="_blank" href={`${GITHUB_URL}/${username}`}>
      <img className={cls(styles.img, 'font-footnote')} src={avatar} alt={`${username} avatar`} />
      <span className={cls('font-footnote', styles.username)}>@{username}</span>
    </a>
  )
}
