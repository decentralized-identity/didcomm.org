import * as React from 'react'
import { Status } from '../../Status/Status'
import { Tags } from '../../Tags/Tags'
import { Link } from 'gatsby'
import { Avatar } from '../../Avatar/Avatar'
import * as styles from './ProtocolsListItem.module.scss'
import { cls } from '../../../common/utils'
import { LastModified } from '../../LastModified/LastModified'
import { Protocol } from '../../../common/types'

type Props = {
  protocol: Protocol
}
export const ProtocolsListItem = ({ protocol }: Props) => {
  const { title, slug, version, status, summary, tags, username, avatar, modifiedTime, licence } = protocol

  return (
    <article className={cls(styles.item, 'rounded')}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <Link to={`/${slug}`} className={styles.title}>
            <h2 className="font-title-2">
              {title}&nbsp;<span className={cls('font-footnote', styles.version)}>{version}</span>
            </h2>
          </Link>
        </div>
        <Status type={status} />
      </div>
      <p className={styles.summary}>{summary}</p>
      <Tags tags={tags} />
      <div className={styles.footer}>
        <Avatar avatar={avatar} username={username} />
        <span className="font-footnote">{licence}</span>
        <LastModified className={cls(styles.lastModified, 'font-footnote')} lastModified={modifiedTime} />
      </div>
    </article>
  )
}
