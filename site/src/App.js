import 'bootstrap/dist/css/bootstrap.css'
import './App.css'

import { useCallback, useMemo, useRef, useTransition } from 'react'
import SelectSearch from 'react-select-search'
import { defaultCardBaseline, githubRepo, issueTemplate, preparedCards, preparedMaps, preparedTags } from './data'
import Loader from './components/Loader'
import Atlas from './components/Atlas'
import { calculateScore, copyToClipboard, filter } from './common'
import Tags from './components/Tags'
import usePersistedState from './hooks/usePersistedState'
import useInputField from './hooks/useInputField'
import GoToTop from './components/GoToTop'
import Map from './components/Map'
import { ReactFlowProvider } from 'reactflow'

function rateMaps(
  foundMaps,
  foundCards,
  layoutInput,
  densityInput,
  bossInput,
  cardInput,
  cardBaselineInput,
  cardMinPriceInput
) {
  const cardWeightBaseline = preparedCards.find(c => c.name === cardBaselineInput).weight

  // First calculate value for cards
  const mapsWithCardValues = foundMaps.map(map => {
    const mapCards = []

    for (let card of map.cards) {
      const dropPoolItems = 1 / (cardWeightBaseline / card.poolWeight) / (card.boss ? 10 : 1)
      mapCards.push({
        ...card,
        dropPoolItems: dropPoolItems,
        value: card.price >= cardMinPriceInput ? card.price * (card.weight / card.poolWeight) * dropPoolItems : 0
      })
    }

    return {
      ...map,
      cards: mapCards.sort((a, b) => b.price - a.price).sort((a, b) => b.value - a.value)
    }
  })

  // Now calculate score for each card
  calculateScore(
    mapsWithCardValues.flatMap(m => m.cards),
    10
  )

  // Now finally calculate overall map score
  const rated = calculateScore(
    mapsWithCardValues.map(map => {
      const layoutValue = (map.rating.layout || 0) * layoutInput
      const densityValue = (map.rating.density || 0) * densityInput
      const bossValue = (map.rating.boss || 0) * bossInput
      let cardValue = 0

      for (let card of map.cards) {
        cardValue += card.score * cardInput
      }

      map.value = layoutValue + densityValue + bossValue + cardValue
      return map
    }),
    100
  )

  // Now find scores for connected maps
  for (let map of rated) {
    const connectedOut = []
    for (let connected of map.connected || []) {
      connectedOut.push({
        name: connected,
        score: (rated.find(rm => rm.name === connected) || {}).score || 0
      })
    }
    map.connected = connectedOut
  }

  return rated.sort((a, b) => b.score - a.score)
}

function parseSearch(s) {
  return (s || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e)
    .map(e => ({
      value: e.replace(/[+-]/g, ''),
      neg: e.startsWith('-')
    }))
}

function buildSearch(s) {
  return s.map(v => (v.neg ? '-' : '') + v.value).join(', ')
}

function filterMaps(ratedMaps, currentSearch) {
  return ratedMaps.filter(m => !currentSearch || filter(currentSearch, m.search))
}

function App() {
  const [isPending, startTransition] = useTransition()
  const shareableRef = useRef(null)
  const poeRef = useRef(null)
  const searchRef = useRef(null)

  const [atlasFull, setAtlasFull] = usePersistedState('atlasFull', false, startTransition)

  const [searchInput, setSearchInput] = usePersistedState('searchInput', '', startTransition, shareableRef)
  const [layoutInput, setLayoutInput, layoutReset, layoutRef] = useInputField(
    'layoutInput',
    3,
    startTransition,
    shareableRef
  )
  const [densityInput, setDensityInput, densityReset, densityRef] = useInputField(
    'densityInput',
    2,
    startTransition,
    shareableRef
  )
  const [bossInput, setBossInput, bossReset, bossRef] = useInputField('bossInput', 1, startTransition, shareableRef)
  const [cardInput, setCardInput, cardReset, cardRef] = useInputField(
    'cardWeightInput',
    2,
    startTransition,
    shareableRef
  )
  const [cardBaselineInput, setCardBaselineInput, cardBaselineReset] = useInputField(
    'cardBaselineInput',
    defaultCardBaseline,
    startTransition,
    shareableRef
  )
  const [cardMinPriceInput, setCardMinPriceInput, cardMinPriceReset, cardMinPriceRef] = useInputField(
    'cardMinPriceInput',
    10,
    startTransition,
    shareableRef
  )

  const ratedMaps = useMemo(
    () =>
      rateMaps(
        preparedMaps,
        preparedCards,
        layoutInput,
        densityInput,
        bossInput,
        cardInput,
        cardBaselineInput,
        cardMinPriceInput
      ),
    [layoutInput, densityInput, bossInput, cardInput, cardBaselineInput, cardMinPriceInput]
  )
  const currentSearch = useMemo(() => parseSearch(searchInput), [searchInput])

  const filteredMaps = useMemo(() => filterMaps(ratedMaps, currentSearch), [ratedMaps, currentSearch])

  const poeRegex = useMemo(() => {
    const re = '"' + [...new Set(filteredMaps.map(m => m.shorthand))].join('|') + '"'
    if (re.length > 50) {
      return 'Too long, be more specific'
    }
    return re
  }, [filteredMaps])

  const addToInput = useCallback(
    (v, neg, remove) => {
      let s = parseSearch(searchRef.current.value || '')

      if (remove) {
        s = s.filter(sv => sv.value !== v)
      } else {
        const sv = s.find(sv => sv.value === v)
        if (sv) {
          sv.neg = neg
        } else {
          s.push({ value: v, neg: neg })
        }
      }

      const val = buildSearch(s)
      searchRef.current.value = val
      setSearchInput(val)
    },
    [setSearchInput, searchRef]
  )

  let containerClass = 'container-fluid p-2'
  let searchClass = ''
  let inputSectionClass = ''
  let inputClass = ''
  let atlasClass = ''

  if (atlasFull) {
    containerClass = containerClass + ' col-lg-3 col-12'
    searchClass = 'p-1'
    inputClass = 'p-1'
    atlasClass = 'col-lg-9 col-12'
  } else {
    containerClass = containerClass + ' row g-0'
    searchClass = 'col col-lg-4 col-12 p-1'
    inputSectionClass = 'col col-lg-8 col-12'
    inputClass = 'col col-lg-3 col-sm-6 col-12 p-1'
  }

  return (
    <>
      <Loader loading={isPending} />
      <div className="row g-0">
        <div className={atlasClass}>
          <ReactFlowProvider>
            <Atlas maps={ratedMaps} currentSearch={currentSearch} full={atlasFull} setFull={setAtlasFull} />
          </ReactFlowProvider>
        </div>
        <div className={containerClass}>
          <div className={searchClass}>
            <label className="form-label">Search</label>
            <input
              className="form-control"
              type="search"
              placeholder="Search for map name, tag or card, comma separated"
              ref={searchRef}
              defaultValue={searchInput}
              onChange={setSearchInput}
            />
            <span className="small">tags:</span>{' '}
            <Tags tags={preparedTags} currentSearch={currentSearch} addToInput={addToInput} />
          </div>
          <div className={inputSectionClass}>
            <div className="row g-0">
              <div className={inputClass}>
                <label className="form-label">Layout weight</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="number"
                    ref={layoutRef}
                    defaultValue={layoutInput}
                    onChange={setLayoutInput}
                  />
                  <button className="btn btn-outline-secondary" onClick={layoutReset}>
                    <i className="fa-solid fa-refresh fa-fw" />
                  </button>
                </div>
              </div>
              <div className={inputClass}>
                <label className="form-label">Density weight</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="number"
                    ref={densityRef}
                    defaultValue={densityInput}
                    onChange={setDensityInput}
                  />
                  <button className="btn btn-outline-secondary" onClick={densityReset}>
                    <i className="fa-solid fa-refresh fa-fw" />
                  </button>
                </div>
              </div>
              <div className={inputClass}>
                <label className="form-label">Boss weight</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="number"
                    ref={bossRef}
                    defaultValue={bossInput}
                    onChange={setBossInput}
                  />
                  <button className="btn btn-outline-secondary" onClick={bossReset}>
                    <i className="fa-solid fa-refresh fa-fw" />
                  </button>
                </div>
              </div>
              <div className={inputClass}>
                <label className="form-label">Card weight</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="number"
                    ref={cardRef}
                    defaultValue={cardInput}
                    onChange={setCardInput}
                  />
                  <button className="btn btn-outline-secondary" onClick={cardReset}>
                    <i className="fa-solid fa-refresh fa-fw" />
                  </button>
                </div>
              </div>
              <div className={inputClass}>
                <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
                  <span className="tooltip-tag-text">
                    The baseline card drop you are expecting to see every map on average. This is used for calculating
                    how many baseline drop pool items you get from map on average. Then single card drop is compared
                    with weight of total drop pool combined with map card pool weight and multiplied by amount of
                    baseline drop pool items you get from map.
                  </span>
                  <label className="form-label">Average card drop per map</label>
                </span>
                <div className="input-group">
                  <SelectSearch
                    options={preparedCards
                      .sort((a, b) => b.weight - a.weight)
                      .map(c => ({ name: c.name + ' (' + c.weight + ')', value: c.name }))}
                    value={cardBaselineInput}
                    placeholder={cardBaselineInput}
                    onChange={e => setCardBaselineInput(e)}
                    search="true"
                  />
                  <button className="btn btn-outline-secondary" onClick={cardBaselineReset}>
                    <i className="fa-solid fa-refresh fa-fw" />
                  </button>
                </div>
              </div>
              <div className={inputClass}>
                <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
                  <span className="tooltip-tag-text">
                    Minimum price for the card to be considered as something that should be accounted for calculating
                    map score and per map value.
                    <br />
                    Try to not go under <b>6c</b> as <b>poe.ninja</b> tends to overvalue the low cost cards by a lot
                    even though when you click on listings the data say something else.
                  </span>
                  <label className="form-label">
                    Minimum card drop price (in <img src="/img/chaos.png" alt="c" width="16" height="16" />)
                  </label>
                </span>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="number"
                    ref={cardMinPriceRef}
                    defaultValue={cardMinPriceInput}
                    onChange={setCardMinPriceInput}
                  />
                  <button className="btn btn-outline-secondary" onClick={cardMinPriceReset}>
                    <i className="fa-solid fa-refresh fa-fw" />
                  </button>
                </div>
              </div>
              <div className={inputClass}>
                <label className="form-label">PoE regex</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="text"
                    ref={poeRef}
                    value={poeRegex}
                    readOnly={true}
                    onFocus={e => e.target.select()}
                  />
                  <button className="btn btn-outline-secondary text-info" onClick={() => copyToClipboard(poeRef)}>
                    <i className="fa-solid fa-copy fa-fw" />
                  </button>
                </div>
              </div>
              <div className={inputClass}>
                <label className="form-label">Shareable link</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="text"
                    ref={shareableRef}
                    readOnly={true}
                    onFocus={e => e.target.select()}
                  />
                  <button className="btn btn-outline-secondary text-info" onClick={() => copyToClipboard(shareableRef)}>
                    <i className="fa-solid fa-copy fa-fw" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <table className="table table-responsive table-striped mb-0">
        <thead>
          <tr>
            <th scope="col">
              <div className="d-lg-flex justify-content-between align-items-end">
                <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
                  <span className="tooltip-tag-text">
                    Map name, colored based on natural tier with map tiers for each Voidstone next to it.
                    <hr />
                    <span className="badge bg-light text-dark m-1">tier 1-5</span>
                    <span className="badge bg-warning text-dark m-1">tier 6-10</span>
                    <span className="badge bg-danger text-dark m-1">tier 11-16</span>
                  </span>
                  Map
                </span>
                <div>
                  <small className="fw-light">
                    <a href={issueTemplate} target="_blank" rel="noreferrer">
                      Data not valid or missing?
                    </a>
                  </small>
                </div>
              </div>
            </th>
            <th scope="col" className="d-none d-md-table-cell">
              <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
                <span className="tooltip-tag-text">
                  How straightforward is the map to clear or how good it is for league mechanics.
                  <br />
                  This data is opinionated, if you disagree with any rating please open issue on GitHub with
                  explanation.
                  <hr />
                  <span className="badge bg-secondary text-dark m-1">unknown</span>
                  <span className="badge bg-danger text-dark m-1">bad</span>
                  <span className="badge bg-warning text-dark m-1">>=3 neutral</span>
                  <span className="badge bg-info text-dark m-1">>=5 good</span>
                  <span className="badge bg-success text-dark m-1">>=7 great</span>
                </span>
                Layout
              </span>
            </th>
            <th scope="col" className="d-none d-md-table-cell">
              <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
                <span className="tooltip-tag-text">
                  How many total base mobs does the map have. Do not accounts for extra sources of mobs like league
                  mechanics and sextants.
                  <br />
                  This data is based on actual mob counts in maps counted using rampage. Some newer maps and unique maps
                  might be missing data as they still need to be collected.
                  <hr />
                  <span className="badge bg-secondary text-dark m-1">unknown</span>
                  <span className="badge bg-danger text-dark m-1">bad</span>
                  <span className="badge bg-warning text-dark m-1">>=3 neutral</span>
                  <span className="badge bg-info text-dark m-1">>=5 good</span>
                  <span className="badge bg-success text-dark m-1">>=7 great</span>
                </span>
                Density
              </span>
            </th>
            <th scope="col" className="d-none d-md-table-cell">
              <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
                <span className="tooltip-tag-text">
                  How annoying/dangerous is the boss to kill.
                  <br />
                  This data is opinionated, if you disagree with any rating please open issue on GitHub with
                  explanation.
                  <hr />
                  <span className="badge bg-secondary text-dark m-1">unknown</span>
                  <span className="badge bg-danger text-dark m-1">hard/annoying</span>
                  <span className="badge bg-warning text-dark m-1">>=3 neutral</span>
                  <span className="badge bg-info text-dark m-1">>=5 alright</span>
                  <span className="badge bg-success text-dark m-1">>=7 easy/fast</span>
                </span>
                Boss
              </span>
            </th>
            <th scope="col">
              <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
                <span className="tooltip-tag-text">Maps adjacent to this map on atlas with score on left.</span>
                Connected
              </span>
            </th>
            <th scope="col">
              <span className="tooltip-tag tooltip-tag-left tooltip-tag-notice">
                <span className="tooltip-tag-text">
                  Cards that drop in the map sorted by <b>drop rate</b> and <b>price</b>. Cards under{' '}
                  <b>{cardMinPriceInput}c</b> are filtered out from rating.
                  <hr />
                  <span className="badge bg-secondary text-dark m-1">not very good</span>
                  <span className="badge bg-dark border border-1 border-info text-info m-1">>=0.5 decent</span>
                  <span className="badge bg-info text-dark m-1">>=2 good</span>
                  <span className="badge bg-primary text-light m-1">>=5 great</span>
                  <span className="badge bg-light text-dark m-1">>=8 amazing</span>
                </span>
                Cards
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredMaps.map(m => (
            <Map key={m.name} map={m} currentSearch={currentSearch} addToInput={addToInput} />
          ))}
        </tbody>
      </table>
      <div className="container-fluid p-4 text-end">
        <div className="d-lg-flex justify-content-between">
          <div>
            For raw data see:{' '}
            <a
              href="https://raw.githubusercontent.com/deathbeam/poe-tools/main/site/src/data/globals.json"
              target="_blank"
              rel="noreferrer"
            >
              globals.json
            </a>{' '}
            <a
              href="https://raw.githubusercontent.com/deathbeam/poe-tools/main/site/src/data/cards.json"
              target="_blank"
              rel="noreferrer"
            >
              cards.json
            </a>{' '}
            <a
              href="https://raw.githubusercontent.com/deathbeam/poe-tools/main/site/src/data/maps.json"
              target="_blank"
              rel="noreferrer"
            >
              maps.json
            </a>
          </div>
          <div>
            Contribute on{' '}
            <a href={githubRepo} target="_blank" rel="noreferrer">
              GitHub
            </a>
            . Also contains sources for all data used on the site.
          </div>
        </div>
      </div>
      <GoToTop />
    </>
  )
}

export default App
