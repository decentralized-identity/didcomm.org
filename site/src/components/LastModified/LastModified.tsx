import * as React from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { DATE_FORMAT } from '../../common/constants'
import { Props } from './LastModified.types'

dayjs.extend(relativeTime)

export const LastModified = ({ lastModified, className, since }: Props) => {
  const date = since ? dayjs().to(lastModified) : dayjs(lastModified).format(DATE_FORMAT)
  return <span className={className}>{date}</span>
}
