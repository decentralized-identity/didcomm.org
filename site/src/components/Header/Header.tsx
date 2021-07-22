import * as React from 'react'
import { graphql, Link, useStaticQuery } from 'gatsby'

import * as styles from './Header.module.css'
import { PropsWithChildren } from 'react'


type QueryData = {
  logo: {
    publicURL: string
  }
}

type Props = PropsWithChildren<{}>

export const Header = ({children}: Props) => {
  const { logo } = useStaticQuery<QueryData>(query)

  return (
    <header>
      <Link to="/" aria-label="Link to home">
        <img className={styles.logo} src={logo.publicURL} />
        <span>DID Communication</span>
      </Link>
      <div>
        {children}
      </div>
      <nav>
        <ul>
          <li><a rel="noreferrer noopener nofollow" href="https://github.com/decentralized-identity/didcomm.org" target="_blank">GitHub repo</a></li>
          <li><a rel="noreferrer noopener nofollow" href="https://identity.foundation/didcomm-messaging/spec/" target="_blank">Specification</a></li>
        </ul>
      </nav>
    </header>
  )
}

const query = graphql`
  {
    logo: file(base: { eq: "didcomm-logo.svg" }) {
      publicURL
    }
  }
`
