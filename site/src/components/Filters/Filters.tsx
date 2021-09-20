import * as React from 'react'
import dayjs from 'dayjs'

import { Checkbox } from '../Checkbox/Checkbox'
import { useEffect, useState } from 'react'
import { cls, formatDateUnit, objectFromEntries } from '../../common/utils'
import { StatusType, Status } from '../../common/types'
import { Button } from '../Button/Button'
import * as styles from './Filters.module.scss'
import { Radio } from '../Radio/Radio'
import { Props } from './Filters.types'

export const Filters = ({ onFilters, allLicenses, ...props }: Props) => {
  const [status, setStatus] = useState<Record<string, boolean>>({})
  const [license, setLicense] = useState<Record<string, boolean>>({})
  const [dateUnit, setDateUnit] = useState<string>()

  useEffect(() => {
    setStatus(
      Object.assign(objectFromEntries(Object.keys(Status).map((s) => [s, false])), objectFromEntries(props.status.map((s) => [s, true]))),
    )
    setLicense(Object.assign(objectFromEntries(allLicenses.map((l) => [l, false])), objectFromEntries(props.license.map((l) => [l, true]))))
    setDateUnit(props.date)
  }, [props.license, props.status, props.date])

  const onSubmit = (e) => {
    e.preventDefault()
    onFilters({
      status: Object.keys(status).filter((s) => status[s]),
      license: Object.keys(license).filter((l) => license[l]),
      date: dateUnit,
    })
  }

  const onChangeStatus = (name: StatusType, checked: boolean) => {
    setStatus({ ...status, [name]: checked })
  }

  const onChangeLicense = (name: string, checked: boolean) => {
    setLicense({ ...license, [name]: checked })
  }

  return (
    <div>
      <h2 className={cls('font-headline', styles.title)}>Filters</h2>
      <form autoCorrect="off" autoComplete="off" onSubmit={onSubmit}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Status</legend>
          <Checkbox
            className={styles.filter}
            value={status.Proposed ?? false}
            onChange={(v) => onChangeStatus('Proposed', v)}
            label="Proposed"
          />
          <Checkbox
            className={styles.filter}
            value={status.Demonstrated ?? false}
            onChange={(v) => onChangeStatus('Demonstrated', v)}
            label="Demonstrated"
          />
          <Checkbox
            className={styles.filter}
            value={status.Production ?? false}
            onChange={(v) => onChangeStatus('Production', v)}
            label="Production"
          />
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>License</legend>
          {allLicenses.map((l) => (
            <Checkbox className={styles.filter} key={l} value={license[l] ?? false} onChange={(v) => onChangeLicense(l, v)} label={l} />
          ))}
        </fieldset>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Date</legend>
          <Radio
            checked={dateUnit === 'year'}
            className={styles.filter}
            name="Date"
            value="year"
            label={formatDateUnit.year}
            onChange={setDateUnit}
          />
          <Radio
            checked={dateUnit === 'month'}
            className={styles.filter}
            name="Date"
            value="month"
            label={formatDateUnit.month}
            onChange={setDateUnit}
          />
          <Radio
            checked={dateUnit === 'week'}
            className={styles.filter}
            name="Date"
            value="week"
            label={formatDateUnit.week}
            onChange={setDateUnit}
          />
          <Radio
            checked={dateUnit === 'day'}
            className={styles.filter}
            name="Date"
            value="day"
            label={formatDateUnit.day}
            onChange={setDateUnit}
          />
        </fieldset>
        <Button expanded secondary type="submit">
          Filter
        </Button>
      </form>
    </div>
  )
}
