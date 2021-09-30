import * as React from 'react'

import { cls } from '../../common/utils'
import { Props } from './Chips.types'
import * as styles from './Chips.module.scss'
import { SvgIcon } from '../SvgIcon/SvgIcon'

export const Chips = ({ content, action, className, actionIcon }: Props) => {
  return (
    <div className={cls(styles.chips, className)}>
      <div className={cls('font-subheadline', styles.content)}>{content}</div>
      <button className={styles.action} onClick={action}>
        <SvgIcon ariaHidden icon={actionIcon} className={styles.actionIcon} />
        <span className="visually-hidden">Drop filter</span>
      </button>
    </div>
  )
}
