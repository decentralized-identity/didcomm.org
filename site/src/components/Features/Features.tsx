import * as React from 'react'
import { Icons, SvgIcon } from '../SvgIcon/SvgIcon'
import * as styles from './Features.module.scss'
import { cls } from '../../common/utils'

export type Feature = {
  icon: Icons
  title: string
  text: string
}

type Props = {
  features?: Array<Feature>
}

export const Features = ({ features }: Props) => {
  return (
    <ul className="grid-3">
      {features?.map((feature) => (
        <li key={feature.title}>
          <article className={styles.feature}>
            <SvgIcon role="presentation" ariaHidden icon={feature.icon} className={styles.icon} />
            <h2 className={cls(styles.title, 'font-title-2')}>{feature.title}</h2>
            <p className={styles.text} dangerouslySetInnerHTML={{ __html: feature.text }} />
          </article>
        </li>
      ))}
    </ul>
  )
}
