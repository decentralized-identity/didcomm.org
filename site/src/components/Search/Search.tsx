import * as React from 'react'
import { useState } from 'react'
import { Icons, SvgIcon } from '../SvgIcon/SvgIcon'
import * as styles from './Search.module.scss'
import { cls } from '../../common/utils'

type Props = {
  onSearch: (query: string) => void
  query?: string
  bordered?: boolean
}

export const Search = ({ onSearch, query = '', bordered }: Props) => {
  const [value, setValue] = useState(query)
  const onSubmit = (e) => {
    e.preventDefault()
    onSearch(value)
  }

  return (
    <form className={styles.search} onSubmit={onSubmit} role="search">
      <label className="visually-hidden" htmlFor="search">
        Search protocols definitions
      </label>
      <input
        className={cls(styles.input, 'rounded', bordered && styles.bordered, 'hide-mobile')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoCorrect="off"
        placeholder="Search protocols to use in your own software"
        autoComplete="off"
        type="text"
        aria-required="true"
        required
        id="search"
      />
      <input
        className={cls(styles.input, 'rounded', bordered && styles.bordered, 'hide-desktop')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoCorrect="off"
        placeholder="Search protocols"
        autoComplete="off"
        type="text"
        aria-required="true"
        required
        id="search"
      />
      <button className={styles.clearButton} onClick={(_) => setValue('')} aria-label="Clear search text" type="button">
        <SvgIcon icon={Icons.cross} className={styles.iconCross} />
      </button>
      <button className={styles.button} type="submit" aria-label="Search for protocols">
        <SvgIcon icon={Icons.magnify} className={styles.iconMagnify} />
      </button>
    </form>
  )
}
