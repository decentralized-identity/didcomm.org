import * as React from 'react'
import dayjs from 'dayjs'

import { Checkbox } from '../Checkbox/Checkbox'
import { useState } from 'react'
import { cls, objectFromEntries } from '../../common/utils'
import { StatusType, Status } from '../../common/types'
import { Button } from '../Button/Button'
import * as styles from './Filters.module.scss'
type Props = {
  licences: string[]
  alllicences: string[]
  onFilters: (filters) => void
  status: Array<typeof Status[StatusType]>
}

export const Filters = ({licences, onFilters, status, alllicences}: Props) => {
  // const [statuses, setStatus] = useState(status.map(s => ({[s]: true})))
  const [statuses, setStatus] = useState(Object.assign(objectFromEntries(Object.values(Status).map(s => [s, false])), objectFromEntries(status.map(s => [s, true]))))
  const [license, setLicense] = useState(Object.assign(objectFromEntries(alllicences.map(l => [l, false])), objectFromEntries(licences.map(l => [l, true]))))
  const [date, setDate] = useState(null)
  // const status = []
  const onSubmit = (e) => {
    e.preventDefault()
    onFilters({
      status: Object.keys(statuses).filter(s => statuses[s]),
      license: Object.keys(license).filter(l => license[l]),
      date: dayjs().subtract(1, date).toDate(),
    })
  }

  const onChangeStatus = (name: typeof Status[StatusType], checked: boolean) => {
    setStatus({...statuses, [name]: checked})
  }

  const onChangeLicense = (name: string, checked: boolean) => {
    setLicense({...license, [name]: checked})
  }


  return (
    <div>
      <h2 className={cls('font-headline', styles.title)}>Filters</h2>
      <form autoCorrect="off" autoComplete="off" onSubmit={onSubmit}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Status</legend>
          <Checkbox className={styles.filter} value={statuses.proposed} onChange={(v) => onChangeStatus(Status.Proposed, v)} label="Proposed" />
          <Checkbox className={styles.filter} value={statuses.demonstrated} onChange={(v) => onChangeStatus(Status.Demonstrated, v)} label="Demonstrated" />
          <Checkbox className={styles.filter} value={statuses.production} onChange={(v) => onChangeStatus(Status.Production, v)} label="Production" />
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>License</legend>
          {alllicences.map(l => (
            <Checkbox className={styles.filter} key={l} value={license[l]} onChange={(v) => onChangeLicense(l, v)} label={l} />
          ))}

        </fieldset>
        <fieldset>
          <legend>Date</legend>
          <div>
            <input name="Date" value='year' type="radio" onChange={e => setDate(e.target.value)} />
            This year
          </div>
          <div>
            <input name="Date" value='day' type="radio" onChange={e => setDate(e.target.value)} />
            Today
          </div>
          <div>
            <input name="Date" value='week' type="radio" onChange={e => setDate(e.target.value)} />
            This week
          </div>

        </fieldset>
        <Button secondary type="submit">Filter</Button>
      </form>
    </div>
  )
}
