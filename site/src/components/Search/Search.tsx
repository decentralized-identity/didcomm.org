import * as React from 'react'
import { useState, FormEventHandler } from 'react'

import { SvgIcon } from '../SvgIcon/SvgIcon'
import { Icons } from '../SvgIcon/SvgIcon.types'
import { cls } from '../../common/utils'
import { Props } from './Search.types'
import * as styles from './Search.module.scss'

export const Search = ({ onSearch, query = '', bordered }: Props) => {
  const [value, setValue] = useState(query)

  const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    onSearch(value)
  }

  return (
    <form className={styles.search} onSubmit={onSubmit} role="search">
      <input
        className={cls(styles.input, 'rounded', bordered && styles.bordered)}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoCorrect="off"
        placeholder=" "
        autoComplete="off"
        type="text"
        id="search"
      />
      <label className={styles.placeholder} htmlFor="search">
        Search protocols<span className={styles.placeholderExtraText}> to use in your own software</span>
      </label>
      <button className={styles.clearButton} onClick={(_) => setValue('')} aria-label="Clear search text" type="button">
        <SvgIcon icon={Icons.cross} className={styles.iconCross} />
      </button>
      <button className={styles.button} type="submit" aria-label="Search for protocols">
        <SvgIcon icon={Icons.magnify} className={styles.iconMagnify} />
      </button>
    </form>
  )
}
