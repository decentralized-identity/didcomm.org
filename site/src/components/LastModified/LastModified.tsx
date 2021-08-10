import * as React from 'react'
import dayjs from 'dayjs'

import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

type Props = {
  lastModified: string
  className?: string
}

export const LastModified = ({ lastModified, className }: Props) => {
  return <span className={className}>{dayjs().to(lastModified)}</span>
}
