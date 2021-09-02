import { Icons } from '../SvgIcon/SvgIcon.types'

export type Props = {
  icon?: Icons
  secondary?: boolean
} & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
