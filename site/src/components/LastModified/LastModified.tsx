import * as React from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { Props } from './LastModified.types'

dayjs.extend(relativeTime)

export const LastModified = ({ lastModified, className }: Props) => {
  return <span className={className}>{dayjs().to(lastModified)}</span>
}
