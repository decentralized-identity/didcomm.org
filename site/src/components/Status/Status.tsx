import * as React from 'react'
import { cls } from '../../common/utils'
import * as styles from './Status.module.scss'
import { StatusType, Status as StatusEnum } from '../../common/types'

type Props = {
  type: StatusType
}

export const Status = ({ type }: Props) => {
  return <div className={cls(styles.status, styles[StatusEnum[type]])}>{type}</div>
}
