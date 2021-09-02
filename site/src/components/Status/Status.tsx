import * as React from 'react'

import { cls } from '../../common/utils'
import { Status as StatusEnum } from '../../common/types'
import { Props } from './Status.types'
import * as styles from './Status.module.scss'

export const Status = ({ type }: Props) => {
  return <div className={cls(styles.status, styles[StatusEnum[type]])}>{type}</div>
}
