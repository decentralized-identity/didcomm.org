import { useEffect, useRef, useState } from 'react'
import { ExactWordIndexStrategy, Search } from 'js-search'
import { Protocol, Status } from '../types'
import dayjs from 'dayjs'

const fieldsToIndex: Array<keyof Protocol> = ['title', 'tags', 'license', 'summary', 'publisher', 'piuri', 'html']

export const filter = (protocols: Array<Protocol>, filters: any) => protocols.filter((protocol: Protocol) => {
  let status = true
  let license = true
  let date = true

  if (filters.statuses.length !== 0) {
    status = filters.statuses.includes(Status[protocol.status])
  }

  if (filters.licenses.length !== 0) {
    license = filters.licenses.includes(protocol.license)
  }

  if (filters.date) {
    date = dayjs(filters.date).isBefore(protocol.modifiedDate)
  }

  return status && license && date
})

export const useProtocolsSearch = (allProtocols: Protocol[], query: string, deps: Array<unknown>): { protocols: Protocol[]; loading: boolean } => {
  const s = useRef<Search | null>(null)

  const [protocols, setProtocols] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)

    // const filtersExist = (filters.statuses.length !== 0 || filters.licenses.length !== 0)

    // const filteredProtocols = filtersExist
    //   ? allProtocols.filter((protocol: Protocol) => {
    //   let status = true
    //   let license = true

    //   if (filters.statuses.length !== 0) {
    //     status = filters.statuses.includes(protocol.status)
    //   }
    //   if (filters.licenses.length !== 0) {
    //     license = filters.licenses.includes(protocol.license)
    //   }
    //   return status && license
    // })
    //   : allProtocols


      s.current = new Search('slug')
      fieldsToIndex.forEach((field) => s.current.addIndex(field))
      s.current.addDocuments(allProtocols)


    setProtocols(query ? s.current!.search(query) : allProtocols)
    setLoading(false)
    console.log(deps);

  }, deps)
  return { protocols, loading }
}
