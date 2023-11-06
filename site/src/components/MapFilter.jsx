import Tags from './Tags'
import { preparedCards, preparedTags } from '../data'
import SelectSearch from 'react-select-search'
import { copyToClipboard } from '../common'
import { useContext } from 'react'
import { AppState } from '../state.js'
import { useComputed } from '@preact/signals'

const FilterInput = ({ input, inputClass, bigInputClass, fullInputClass }) => {
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
            <input
              id={input.name}
              className="form-control"
              type="number"
              defaultValue={input.signal.value}
              value={input.signal.value}
              onChange={input.signal.change}
            />
            <button className="btn btn-outline-secondary" onClick={input.signal.reset}>
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
            <select
              id={input.name}
              className="form-control"
              defaultValue={input.signal.value}
              value={input.signal.value}
              onChange={input.signal.change}
            >
              {Object.entries(input.options).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
            <button className="btn btn-outline-secondary" onClick={input.signal.reset}>
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
              value={input.signal.value}
              readOnly={true}
              onFocus={e => e.target.select()}
            />
            <button className="btn btn-outline-secondary text-info" onClick={() => copyToClipboard(input.signal.value)}>
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
              value={input.signal.value}
              placeholder={input.signal.value}
              onChange={input.signal.change}
              search="true"
            />
            <input
              className="form-control select-search-number text-center"
              type="number"
              defaultValue={input.numberSignal.value}
              value={input.numberSignal.value}
              onChange={input.numberSignal.change}
            />
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                input.signal.reset()
                input.numberSignal.reset()
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

const MapFilter = ({ sidebar }) => {
  const state = useContext(AppState)

  const inputs = useComputed(() => [
    {
      name: 'Layout weight',
      tooltip: (
        <>
          The weight of layout rating when calculating score for map (so end result is map layout * layout weight).
          <br />
          <b>This is not minimal layout rating filter</b>, this will simply push maps with good layouts lower or higher
          in list.
        </>
      ),
      type: 'number',
      signal: state.input.layout
    },
    {
      name: 'Density weight',
      tooltip: (
        <>
          The weight of density rating when calculating score for map (so end result is map density * density weight).
          <br />
          <b>This is not minimal density rating filter</b>, this will simply push maps with good density lower or higher
          in list.
        </>
      ),
      type: 'number',
      signal: state.input.density
    },
    {
      name: 'Boss weight',
      tooltip: (
        <>
          The weight of boss rating when calculating score for map (so end result is map boss * boss weight).
          <br />
          <b>This is not minimal boss rating filter</b>, this will simply push maps with good boss lower or higher in
          list.
        </>
      ),
      type: 'number',
      signal: state.input.boss
    },
    {
      name: 'Card weight',
      tooltip: (
        <>
          The weight of card rating when calculating score for map (so end result is map card rating * card weight).
          <br />
          <b>This is not minimal card weight filter</b>, this will simply push maps with good cards lower or higher in
          list.
        </>
      ),
      type: 'number',
      signal: state.input.card
    },
    {
      name: 'Atlas voidstones',
      tooltip: <>How many voidstones you have. Used for marking cards as droppable or not and determining map tiers.</>,
      type: 'select',
      options: {
        0: '0 voidstones',
        1: '1 voidstone',
        2: '2 voidstones',
        3: '3 voidstones',
        4: '4 voidstones'
      },
      signal: state.input.voidstones
    },
    {
      name: 'Card price source',
      tooltip: <>Source of price data, can be either League or Standard.</>,
      type: 'select',
      options: {
        league: 'League',
        standard: 'Standard'
      },
      signal: state.input.cardPriceSource
    },
    {
      name: 'Card value source',
      tooltip: <>How card value is calculated, either based on card map drops or card value from kirac missions.</>,
      type: 'select',
      options: {
        map: 'Map drops',
        kirac: 'Kirac missions'
      },
      signal: state.input.cardValueSource
    },
    {
      name: 'Minimum card price',
      tooltip: (
        <>
          Minimum price for the card to be considered as something that should be accounted for calculating map score
          and per map value.
          <br />
          Try to not go under <b>6c</b> as <b>poe.ninja</b> tends to overvalue the low cost cards by a lot even though
          when you click on listings the data say something else.
        </>
      ),
      type: 'number',
      signal: state.input.cardMinPrice
    },
    {
      name: 'Average card per map',
      tooltip: (
        <>
          The baseline card drop you are expecting to see every map on average with number input next to it. Positive
          number indicates x cards dropped per map, negative number indicates card dropped every x maps.
          <br />
          This is used for calculating how many drop pool items you get on average and that is used for{' '}
          <b>calculating chance to get card per map</b>.
          <br />
          You should set this value to your observed drop rate of index card (for example Union in Cemetery) so the site
          can predict drop rates for your current farming strategy.
        </>
      ),
      type: 'cardselect',
      options: preparedCards
        .sort((a, b) => b.weight - a.weight)
        .map(c => ({ name: `${c.name} (${c.weight})`, value: c.name })),
      signal: state.input.cardBaseline,
      numberSignal: state.input.cardBaselineNumber,
      size: 'big'
    },
    {
      name: 'Card display',
      tooltip: <>Which cards are displayed/hidden.</>,
      type: 'select',
      options: {
        all: 'All cards',
        high: 'High value only',
        drop: 'Droppable only',
        'high+drop': 'High value and droppable only'
      },
      signal: state.input.cardDisplay
    },
    {
      name: 'Map display',
      tooltip: (
        <>
          Which maps and aras are displayed.
          <br />
          <br />
          <b>Atlas maps:</b>
          <br />
          All maps on atlas
          <br />
          <b>Atlas+Unique+Special maps:</b>
          <br />
          All maps on atlas and all unique and special map areas (that arent necessarily on atlas but are in game)
          <br />
          <b>All maps:</b>
          <br />
          All maps and areas including atlas maps that are not on atlas
          <br />
          <b>Atlas+Unique+Special+Act areas:</b>
          <br />
          Atlas+Unique+Special maps and act areas (for example <b>Blood Aqueduct</b>)
          <br />
          <b>All areas:</b>
          <br />
          Atlas+Unique+Special+Act areas and atlas maps that are currently not on atlas.
        </>
      ),
      type: 'select',
      options: {
        atlas: 'Atlas maps',
        'atlas+unique+special': 'Atlas+Unique+Special maps',
        allmaps: 'All maps',
        'atlas+unique+special+act': 'Atlas+Unique+Special+Act areas',
        all: 'All areas'
      },
      signal: state.input.mapDisplay
    },
    {
      name: 'PoE Regex',
      tooltip: (
        <>
          Generates string that can be copy/pasted to Path of Exile search boxes that will search for the filtered maps.
          PoE search fields are limited to 50 characters so the string is truncated to fit the top maps based off search
          criteria.
        </>
      ),
      type: 'copytext',
      signal: state.mapRegex,
      size: 'full'
    },
    {
      name: 'Shareable link',
      tooltip: <>Link that contains current filter configuration that can be shared with other people.</>,
      type: 'copytext',
      size: 'big',
      hidden: true
    }
  ])

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
          defaultValue={state.input.search.value}
          value={state.input.search.value}
          onChange={state.input.search.change}
        />
        <span className="small">tags:</span> <Tags tags={preparedTags} />
      </div>
      <div className={inputSectionClass}>
        <div className="row g-0">
          {inputs.value.map(input => (
            <FilterInput
              key={input.name}
              input={input}
              inputClass={inputClass}
              fullInputClass={fullInputClass}
              bigInputClass={bigInputClass}
            />
          ))}
        </div>
      </div>
    </>
  )
}
export default MapFilter
