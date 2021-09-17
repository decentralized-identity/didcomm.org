import { Protocol } from '../../common/types'

export type Props = {
  protocols: Protocol[]
  onTagClick?: (tag: string) => void
}
