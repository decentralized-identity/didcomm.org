import * as React from 'react'

import { Status } from '../../Status/Status'
import { Tags } from '../../Tags/Tags'
import { Link } from 'gatsby'
import { Avatar } from '../../Avatar/Avatar'
import { cls } from '../../../common/utils'
import { LastModified } from '../../LastModified/LastModified'
import { Props } from './ProtocolsListItem.types'
import * as styles from './ProtocolsListItem.module.scss'

export const ProtocolsListItem = ({ protocol }: Props) => {
  const { title, slug, version, status, summary, tags, publisher, avatar, modifiedDate, licence } = protocol

  return (
    <article className={cls(styles.item, 'rounded')}>
      <div className={styles.header}>
        <Link to={`/${slug}`} className={styles.title}>
          <h2 className="font-title-2">
            {title}&nbsp;<span className={cls('font-footnote', styles.version)}>{version}</span>
          </h2>
        </Link>
        <Status type={status} />
      </div>
      <p className={styles.summary}>{summary}</p>
      <Tags tags={tags} />
      <div className={styles.footer}>
        <div className={styles.avatar}><Avatar avatar={avatar} publisher={publisher} /></div>
        <span className="font-footnote">{licence}</span>
        <LastModified since className={cls(styles.lastModified, 'font-footnote')} lastModified={modifiedDate} />
      </div>
    </article>
  )
}
