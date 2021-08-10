import * as React from 'react'
import { graphql, useStaticQuery } from 'gatsby'

type QueryData = {
  icons: {
    publicURL: string
  }
}

type Props = {
  icon: Icons
  className: string
  role?: React.AriaRole
  ariaHidden?: boolean
}

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

export enum Icons {
  logo = 'logo',
  magnify = 'magnify',
  cross = 'cross',
  idea = 'idea',
  document = 'document',
  share = 'share',
}
