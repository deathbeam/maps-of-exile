import { useAtom } from 'jotai'
import { useResetAtom } from 'jotai/utils'
import { memo, useRef } from 'react'
import Select from 'react-select'

import { copyToClipboard } from '../common'

const MapFilterInput = ({ input, inputClass, bigInputClass, fullInputClass }) => {
  const [value, setValue] = useAtom(input.def)
  const reset = useResetAtom(input.def)
  const [numberValue, setNumberValue] = useAtom(input.numberDef)
  const numberReset = useResetAtom(input.numberDef)
  const ref = useRef(null)

  if (input.hidden) {
    return null
  }

  let divInputClass = inputClass
  if (input.size === 'big') {
    divInputClass = bigInputClass
  } else if (input.size === 'full') {
    divInputClass = fullInputClass
  }

  switch (input.type) {
    case 'search':
      return (
        <div className={divInputClass}>
          <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
            <span className="tooltip-tag-text">{input.tooltip}</span>
            <label htmlFor={input.name} className="form-label">
              {input.name}
            </label>
          </span>
          <input
            id={input.name}
            className="form-control"
            type="search"
            placeholder={input.placeholder}
            value={value}
            onChange={setValue}
          />
        </div>
      )
    case 'number':
      return (
        <div className={divInputClass}>
          <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
            <span className="tooltip-tag-text">{input.tooltip}</span>
            <label htmlFor={input.name} className="form-label">
              {input.name}
            </label>
          </span>
          <div className="input-group">
            <input id={input.name} className="form-control" type="number" value={value} onChange={setValue} />
            <button className="btn btn-outline-secondary" onClick={reset}>
              <i className="fa-solid fa-refresh fa-fw" />
            </button>
          </div>
        </div>
      )
    case 'select':
      return (
        <div className={divInputClass}>
          <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
            <span className="tooltip-tag-text">{input.tooltip}</span>
            <label htmlFor={input.name} className="form-label">
              {input.name}
            </label>
          </span>
          <div className="input-group">
            <select id={input.name} className="form-control" value={value} onChange={setValue}>
              {Object.entries(input.options).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
            <button className="btn btn-outline-secondary" onClick={reset}>
              <i className="fa-solid fa-refresh fa-fw" />
            </button>
          </div>
        </div>
      )
    case 'multiselect':
      return (
        <div className={divInputClass}>
          <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
            <span className="tooltip-tag-text">{input.tooltip}</span>
            <label htmlFor={input.name} className="form-label">
              {input.name}
            </label>
          </span>
          <div className="input-group">
            <Select
              id={input.name}
              className="form-control"
              classNames={{
                container: () => 'p-0 m-0',
                control: () => 'm-0 ps-3 pe-3',
                multiValue: () => 'badge badge-fw text-dark bg-secondary me-1',
                option: state =>
                  state.isSelected
                    ? 'ps-3 pe-3 bg-primary'
                    : state.isFocused
                    ? 'ps-3 pe-3 bg-secondary'
                    : 'ps-3 pe-3 bg-dark'
              }}
              unstyled
              isMulti
              options={input.options}
              value={value && value.map(v => input.options.find(o => o.value === v)).filter(v => v !== undefined)}
              onChange={e => {
                setValue(e.map(e => e.value))
              }}
            />
            <button className="btn btn-outline-secondary" onClick={reset}>
              <i className="fa-solid fa-refresh fa-fw" />
            </button>
          </div>
        </div>
      )
    case 'copytext':
      return (
        <div className={divInputClass}>
          <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
            <span className="tooltip-tag-text">{input.tooltip}</span>
            <label htmlFor={input.name} className="form-label">
              {input.name}
            </label>
          </span>
          <div className="input-group">
            <input
              ref={ref}
              id={input.name}
              className="form-control"
              type="text"
              value={value}
              readOnly={true}
              onFocus={e => e.target.select()}
            />
            <button className="btn btn-outline-secondary text-info" onClick={() => copyToClipboard(ref)}>
              <i className="fa-solid fa-copy fa-fw" />
            </button>
          </div>
        </div>
      )
    case 'cardselect':
      return (
        <div className={divInputClass}>
          <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
            <span className="tooltip-tag-text">{input.tooltip}</span>
            <label className="form-label">{input.name}</label>
          </span>
          <div className="input-group">
            <Select
              id={input.name}
              className="form-control"
              classNames={{
                container: () => 'p-0 m-0',
                control: () => 'm-0 ps-3 pe-3',
                option: state =>
                  state.isSelected
                    ? 'ps-3 pe-3 bg-primary'
                    : state.isFocused
                    ? 'ps-3 pe-3 bg-secondary'
                    : 'ps-3 pe-3 bg-dark'
              }}
              unstyled
              options={input.options}
              value={value && input.options.find(o => o.value === value)}
              placeholder={value}
              onChange={e => {
                setValue(e.value)
              }}
            />
            <input
              className="form-control text-center"
              style={{ maxWidth: '4em' }}
              type="number"
              value={numberValue}
              onChange={setNumberValue}
            />
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                reset()
                numberReset()
              }}
            >
              <i className="fa-solid fa-refresh fa-fw" />
            </button>
          </div>
        </div>
      )
    default:
      return null
  }
}

export default memo(MapFilterInput)
