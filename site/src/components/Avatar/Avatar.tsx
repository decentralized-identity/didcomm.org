import * as React from 'react'
import { GITHUB_URL } from '../../common/constants'
import { cls } from '../../common/utils'
import * as styles from './Avatar.module.scss'

type Props = {
  username: string
  avatar: string
}

export const Avatar = ({ username, avatar }: Props) => {
  return (
    <a className={styles.avatar} target="_blank" href={`${GITHUB_URL}/${username}`}>
      <img className={cls(styles.img, 'font-footnote')} src={avatar} alt={`${username} avatar`} />
      <span className={cls('font-footnote', styles.username)}>@{username}</span>
    </a>
  )
}
