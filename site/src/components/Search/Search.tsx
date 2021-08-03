import * as React from 'react'

export const Search = () => (
  <div>
    <form>
      <div>
        <label>
          <span>Search</span>
          <input autoCorrect="off" placeholder="Search protocols to use in your own software" autoComplete="off" type="search" aria-label="Search protocols definitions" />
        </label>
      </div>
      <button type="submit">Search</button>
    </form>
  </div>
)
