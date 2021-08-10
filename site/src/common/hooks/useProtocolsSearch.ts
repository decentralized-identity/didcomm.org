import { useEffect, useRef, useState } from 'react'
import { Search } from 'js-search'
import { Protocol } from '../types'

const fieldsToIndex = ['title', 'keywords', 'licence']

export const useProtocolsSearch = (allProtocols: Protocol[], query: string): { protocols: Protocol[]; loading: boolean } => {
  const s = useRef<Search | null>(null)
  const [protocols, setProtocols] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    if (s.current === null) {
      s.current = new Search('slug')
      fieldsToIndex.forEach((field) => s.current.addIndex(field))

      s.current.addDocuments(allProtocols)
    }
    setProtocols(query ? s.current!.search(query) : allProtocols)
    setLoading(false)
  }, [query])
  return { protocols, loading }
}
