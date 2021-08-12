import * as React from 'react'
import { graphql, useStaticQuery } from 'gatsby'

import { Props, QueryData } from './SvgIcon.types'

export const SvgIcon = ({ icon, className, role, ariaHidden }: Props) => {
  const {
    icons: { publicURL: icons },
  } = useStaticQuery<QueryData>(query)
  return (
    <svg role={role} aria-hidden={ariaHidden} className={className}>
      <use href={`${icons}#${icon}`} />
    </svg>
  )
}

const query = graphql`
  {
    icons: file(base: { eq: "icons.svg" }) {
      publicURL
    }
  }
`
