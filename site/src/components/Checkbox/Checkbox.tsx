import * as React from 'react'

import { cls } from '../../common/utils'
import { Props } from './Checkbox.types'
import * as styles from './Checkbox.module.scss'

export const Checkbox = ({ value, onChange, label, className }: Props) => {
  return (
    <label className={cls(styles.check, className)}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className={cls('visually-hidden', styles.input)}
      />
      <span className={cls(styles.checkbox, 'rounded')} />
      {label}
    </label>
  )
}
