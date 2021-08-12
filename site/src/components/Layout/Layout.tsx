import * as React from 'react'

import { Seo } from '../Seo/Seo'
import { cls } from '../../common/utils'
import { Props } from './Layout.types'
import * as styles from './Layout.module.scss'

export const Layout = ({ title, primary, accent, children }: Props) => {
  return (
    <>
      <Seo title={title} />
      <div className={cls(styles.layout, primary && styles.primary, accent && styles.accent)}>{children}</div>
    </>
  )
}
