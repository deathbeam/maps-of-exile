import Tags from './Tags'
import { preparedTags } from '../data'
import SelectSearch from 'react-select-search'
import { copyToClipboard } from '../common'

const toInput = (input, inputClass, bigInputClass, fullInputClass) => {
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
            <label className="form-label">{input.name}</label>
          </span>
          <div className="input-group">
            <input
              className="form-control"
              type="number"
              ref={input.ref}
              defaultValue={input.input}
              onChange={input.setInput}
            />
            <button className="btn btn-outline-secondary" onClick={input.reset}>
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
            <label className="form-label">{input.name}</label>
          </span>
          <div className="input-group">
            <select className="form-control" ref={input.ref} defaultValue={input.input} onChange={input.setInput}>
              {Object.entries(input.options).map(([key, value]) => (
                <option value={key}>{value}</option>
              ))}
            </select>
            <button className="btn btn-outline-secondary" onClick={input.reset}>
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
            <label className="form-label">{input.name}</label>
          </span>
          <div className="input-group">
            <input
              className="form-control"
              type="text"
              ref={input.ref}
              value={input.input}
              readOnly={true}
              onFocus={e => e.target.select()}
            />
            <button className="btn btn-outline-secondary text-info" onClick={() => copyToClipboard(input.ref)}>
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
            <SelectSearch
              options={input.options}
              value={input.input}
              placeholder={input.input}
              onChange={input.setInput}
              search="true"
            />
            <input
              className="form-control select-search-number text-center"
              type="number"
              ref={input.numberRef}
              defaultValue={input.numberInput}
              onChange={input.setNumberInput}
            />
            <button
              className="btn btn-outline-secondary"
              onClick={e => {
                input.reset()
                input.numberReset()
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

const MapFilter = ({ sidebar, addToInput, currentSearch, searchRef, searchInput, setSearchInput, inputs }) => {
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
        <label className="form-label">Search</label>
        <input
          className="form-control"
          type="search"
          placeholder="Search for map, tag, card, card reward, comma separated"
          ref={searchRef}
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
