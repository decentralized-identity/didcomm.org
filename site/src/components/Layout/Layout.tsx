import * as React from 'react'
import { PropsWithChildren } from 'react'
import { Seo } from '../Seo/Seo'

type Props = PropsWithChildren<{
  title?: string
}>


export const Layout = ({ title, children }: Props) => {
  return (
    <>
      <Seo title={title} />
      <main>{children}</main>
    </>
  )
}
