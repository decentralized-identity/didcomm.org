import { Icons } from '../SvgIcon/SvgIcon.types'

export type Feature = {
  icon: Icons
  title: string
  text: string
}

export type Props = {
  features?: Array<Feature>
}
