import * as React from 'react'
import { PropsWithChildren } from 'react'
import { Seo } from '../Seo/Seo'
import * as styles from './Layout.module.scss'
import { cls } from '../../common/utils'

type Props = PropsWithChildren<{
  title?: string
  primary?: boolean
  accent?: boolean
}>

export const Layout = ({ title, primary, accent, children }: Props) => {
  return (
    <>
      <Seo title={title} />
      <div className={cls(styles.layout, primary && styles.primary, accent && styles.accent)}>{children}</div>
    </>
  )
}
