import * as React from 'react'

import { Props } from './Radio.types'
import { cls } from '../../common/utils'
import * as styles from './Radio.module.scss'

export const Radio = ({ onChange, label, value, name, checked, className }: Props) => {
  return (
    <label className={cls(styles.radio, className)}>
      <input
        checked={checked}
        className={cls(styles.input, 'visually-hidden')}
        name={name}
        type="radio"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className={styles.control} />
      <span className={styles.label}>{label}</span>
    </label>
  )
}
