import * as React from 'react'

import { SvgIcon } from '../SvgIcon/SvgIcon'
import { cls } from '../../common/utils'
import { Props } from './Button.types'
import * as styles from './Button.module.scss'
import { ForwardedRef } from 'react'

export const Button = React.forwardRef(
  ({ icon, children, secondary, className, primary, expanded, ...props }: Props, ref: ForwardedRef<HTMLButtonElement>) => {
    return (
      <button
        className={cls(
          styles.button,
          'font-callout',
          'rounded',
          'shadow-medium',
          secondary && styles.secondary,
          primary && styles.primary,
          expanded && styles.expanded,
          className,
        )}
        ref={ref}
        {...props}
      >
        {icon ? <SvgIcon icon={icon} className={styles.icon} /> : null}
        {children}
      </button>
    )
  },
)
