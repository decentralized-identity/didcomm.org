import { Protocol } from '../../../common/types'

export type Props = {
  protocol: Protocol
  onTagClick?: (tag: string) => void
}
