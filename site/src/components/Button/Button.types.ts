import { Icons } from '../SvgIcon/SvgIcon.types'

export type Props = {
  icon?: Icons
  secondary?: boolean
  primary?: boolean
  expanded?: boolean
} & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
