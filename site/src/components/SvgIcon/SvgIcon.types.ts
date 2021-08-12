export type QueryData = {
  icons: {
    publicURL: string
  }
}

export type Props = {
  icon: Icons
  className: string
  role?: React.AriaRole
  ariaHidden?: boolean
}

export enum Icons {
  logo = 'logo',
  magnify = 'magnify',
  cross = 'cross',
  idea = 'idea',
  document = 'document',
  share = 'share',
}
