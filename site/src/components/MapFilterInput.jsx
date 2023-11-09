import { memo } from 'react'
import { useAtom } from 'jotai'
import { useResetAtom } from 'jotai/utils'
import { copyToClipboard } from '../common.js'
import SelectSearch from 'react-select-search'

const MapFilterInput = ({ input, inputClass, bigInputClass, fullInputClass }) => {
  const [value, setValue] = useAtom(input.def)
  const reset = useResetAtom(input.def)
  const [numberValue, setNumberValue] = useAtom(input.numberDef)
  const numberReset = useResetAtom(input.numberDef)

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
              id={input.name}
              className="form-control"
              type="text"
              value={value}
              readOnly={true}
              onFocus={e => e.target.select()}
            />
            <button className="btn btn-outline-secondary text-info" onClick={() => copyToClipboard(input.def.ref)}>
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
            <SelectSearch options={input.options} value={value} placeholder={value} onChange={setValue} search="true" />
            <input
              className="form-control select-search-number text-center"
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
