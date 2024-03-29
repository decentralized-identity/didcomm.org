import * as React from 'react'

import { Search } from '../Search/Search'
import { Link } from 'gatsby'
import { cls } from '../../common/utils'
import { Props } from './Hero.types'
import * as styles from './Hero.module.scss'

export const Hero = ({ navigate }: Props) => {
  return (
    <div className={styles.hero}>
      <h1 className="font-title-1">Share protocols built on DIDComm</h1>
      <p className={cls(styles.subtitle, 'font-subheadline')}>Powerful, high-trust, self-sovereign interactions over any transport</p>
      <Search onSearch={(query) => navigate(`/search/?q=${encodeURIComponent(query)}&page=1`)} />
      <div className={styles.browseAll}>
        or&nbsp;
        <Link className={styles.browseAllLink} to="/search/?page=1">
          browse all protocols
        </Link>
      </div>
    </div>
  )
}
