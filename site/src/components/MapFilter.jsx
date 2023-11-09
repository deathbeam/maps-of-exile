import Tags from './Tags'
import { preparedTags } from '../data'
import SelectSearch from 'react-select-search'
import { copyToClipboard } from '../common'

const toInput = (input, inputClass, bigInputClass, fullInputClass) => {
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
        <div key={input.name} className={divInputClass}>
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
              type="number"
              value={input.def.get}
              onChange={input.def.set}
            />
            <button className="btn btn-outline-secondary" onClick={input.def.reset}>
              <i className="fa-solid fa-refresh fa-fw" />
            </button>
          </div>
        </div>
      )
    case 'select':
      return (
        <div key={input.name} className={divInputClass}>
          <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
            <span className="tooltip-tag-text">{input.tooltip}</span>
            <label htmlFor={input.name} className="form-label">
              {input.name}
            </label>
          </span>
          <div className="input-group">
            <select id={input.name} className="form-control" value={input.def.get} onChange={input.def.set}>
              {Object.entries(input.options).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
            <button className="btn btn-outline-secondary" onClick={input.def.reset}>
              <i className="fa-solid fa-refresh fa-fw" />
            </button>
          </div>
        </div>
      )
    case 'copytext':
      return (
        <div key={input.name} className={divInputClass}>
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
              value={input.def.get}
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
        <div key={input.name} className={divInputClass}>
          <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
            <span className="tooltip-tag-text">{input.tooltip}</span>
            <label className="form-label">{input.name}</label>
          </span>
          <div className="input-group">
            <SelectSearch
              options={input.options}
              value={input.def.get}
              placeholder={input.def.get}
              onChange={input.def.set}
              search="true"
            />
            <input
              className="form-control select-search-number text-center"
              type="number"
              value={input.numberDef.get}
              onChange={input.numberDef.set}
            />
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                input.def.reset()
                input.numberDef.reset()
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

const MapFilter = ({ sidebar, addToInput, currentSearch, searchInput, setSearchInput, inputs }) => {
  let searchClass = ''
  let inputSectionClass = ''
  let inputClass = ''
  let bigInputClass = ''
  let fullInputClass = ''

  if (sidebar) {
    searchClass = 'p-1'
    inputClass = 'col-lg-12 col-md-6 col-12 p-1'
    bigInputClass = inputClass
    fullInputClass = inputClass
  } else {
    searchClass = 'col-lg-4 col-12 p-1'
    inputSectionClass = 'col col-lg-8 col-12'
    inputClass = 'col-lg-3 col-md-6 col-12 p-1'
    bigInputClass = 'col-lg-6 col-md-6 col-12 p-1'
    fullInputClass = 'col-lg-12 col-md-6 col-12 p-1'
  }

  return (
    <>
      <div className={searchClass}>
        <label htmlFor="Search" className="form-label">
          Search
        </label>
        <input
          id="Search"
          className="form-control"
          type="search"
          placeholder="Search for map, tag, card, card reward, comma separated"
          defaultValue={searchInput}
          onChange={setSearchInput}
        />
        <span className="small">tags:</span>{' '}
        <Tags tags={preparedTags} currentSearch={currentSearch} addToInput={addToInput} />
      </div>
      <div className={inputSectionClass}>
        <div className="row g-0">{inputs.map(input => toInput(input, inputClass, bigInputClass, fullInputClass))}</div>
      </div>
    </>
  )
}
export default MapFilter
