import * as React from 'react'

import { SvgIcon } from '../SvgIcon/SvgIcon'
import { cls } from '../../common/utils'
import { Props } from './Features.type'
import * as styles from './Features.module.scss'

export const Features = ({ features }: Props) => {
  return (
    <ul className="grid-3">
      {features?.map((feature) => (
        <li key={feature.title}>
          <article className={styles.feature}>
            <SvgIcon role="presentation" ariaHidden icon={feature.icon} className={styles.icon} />
            <h2 className={cls(styles.title, 'font-title-2')}><a href={feature.link}>{feature.title}</a></h2>
            <p className={styles.text} dangerouslySetInnerHTML={{ __html: feature.text }} />
          </article>
        </li>
      ))}
    </ul>
  )
}
