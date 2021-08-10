import * as React from 'react'

import * as styles from './Checkbox.module.scss'
import { cls } from '../../common/utils'

type Props = {
  value: boolean
  onChange: (value: boolean) => void
  label: string
}

export const Checkbox = ({ value, onChange, label }: Props) => {
  return (
    <label className={styles.check}>
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
