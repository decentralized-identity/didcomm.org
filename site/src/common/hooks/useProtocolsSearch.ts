import { useEffect, useRef, useState } from 'react'
import { Search } from 'js-search'
import { Protocol } from '../types'

const fieldsToIndex: Array<keyof Protocol> = ['title', 'tags', 'license', 'summary', 'publisher', 'piuri', 'html']

export const useProtocolsSearch = (
  allProtocols: Protocol[],
  query: string,
  deps: Array<unknown>,
): { protocols: Protocol[]; loading: boolean } => {
  const s = useRef<Search | null>(null)

  const [protocols, setProtocols] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)

    s.current = new Search('slug')
    fieldsToIndex.forEach((field) => s.current.addIndex(field))
    s.current.addDocuments(allProtocols)

    setProtocols(query ? s.current!.search(query) : allProtocols)

    setLoading(false)
  }, deps)
  return { protocols, loading }
}
