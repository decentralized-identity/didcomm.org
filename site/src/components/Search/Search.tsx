import * as React from 'react'
import { FormEventHandler, useState } from 'react'

type Props = {
  onSearch: (query: string) => void
  query?: string
}

export const Search = ({onSearch, query = ''}: Props) => {
  const [value, setValue] = useState(query)
  const onSubmit = (e) => {
    e.preventDefault()
    onSearch(value)
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div>
          <label>
            <span>Search</span>
            <input value={value} onChange={e => setValue(e.target.value)} autoCorrect='off' placeholder='Search protocols to use in your own software' autoComplete='off'
                   type='search' aria-label='Search protocols definitions' />
          </label>
        </div>
        <button type='submit'>Search</button>
      </form>
    </div>
  )
}
