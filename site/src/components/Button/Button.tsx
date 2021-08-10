import * as React from 'react'

import { Icons, SvgIcon } from '../SvgIcon/SvgIcon'
import { cls } from '../../common/utils'
import * as styles from './Button.module.scss'

type Props = {
  icon?: Icons
  secondary?: boolean
} & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>

export const Button = ({ icon, children, secondary, className, ...props }: Props) => {
  return (
    <button
      className={cls(styles.button, 'font-callout', 'rounded', 'shadow-medium', secondary && styles.buttonSecondary, className)}
      {...props}
    >
      {icon ? <SvgIcon icon={icon} className={styles.icon} /> : null}
      {children}
    </button>
  )
}
