import * as React from 'react'
import { Link } from 'gatsby'

import { cls } from '../../common/utils'
import { SvgIcon } from '../SvgIcon/SvgIcon'
import { Icons } from '../SvgIcon/SvgIcon.types'
import { Props } from './Header.types'
import * as styles from './Header.module.scss'

export const Header = ({ children, primary, className, hideLinks }: Props) => {
  return (
    <header className={cls(styles.header, primary && styles.primary, className)}>
      <div className={styles.container}>
        <Link title="Link to home" activeClassName={styles.active} className={styles.logo} to="/" aria-label="Link to home">
          <SvgIcon icon={Icons.logo} className={styles.logoImg} />
          <span className={cls(styles.logoText, 'hide-mobile')}>DIDComm</span>
        </Link>
        <div className={styles.search}>{children}</div>
        {!hideLinks && (
          <nav className={cls('hide-mobile font-footnote', styles.linksContainer)}>
            <ul className={styles.links}>
              <li>
                <a
                  className={styles.link}
                  rel="noreferrer noopener nofollow"
                  href="https://github.com/decentralized-identity/didcomm.org"
                  target="_blank"
                >
                  GitHub repo
                </a>
              </li>
              <li>
                <a
                  className={styles.link}
                  rel="noreferrer noopener nofollow"
                  href="https://identity.foundation/didcomm-messaging/spec/v2.0/"
                  target="_blank"
                >
                  Specification
                </a>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  )
}
