import 'bootstrap/dist/css/bootstrap.css'
import './App.css'

import { useMemo, useTransition, useRef, useCallback } from 'react'
import SelectSearch from 'react-select-search'
import { defaultCardBaseline, githubRepo, issueTemplate, preparedCards, preparedMaps, preparedTags } from './data'
import Loader from './components/Loader'
import Atlas from './components/Atlas'
import { calculateScore, filter } from './common'
import Tags from './components/Tags'
import usePersistedState from './hooks/usePersistedState'
import useInputField from './hooks/useInputField'
import GoToTop from './components/GoToTop'
import Map from './components/Map'
import { ReactFlowProvider } from 'reactflow'

function rateCards(cards, cardMinPrice) {
  return calculateScore(
    cards.map(card => ({
      ...card,
      value: (card.price >= cardMinPrice ? card.weight : 0) * card.price
    })),
    10
  )
}

function rateMaps(foundMaps, foundCards, layoutInput, densityInput, bossInput, cardInput) {
  const rated = calculateScore(
    foundMaps.map(map => {
      const layoutValue = (map.rating.layout || 0) * layoutInput
      const densityValue = (map.rating.density || 0) * densityInput
      const bossValue = (map.rating.boss || 0) * bossInput

      const mapCards = []

      for (let card of map.cards) {
        const cardData = foundCards.find(c => c.name === card)
        if (!cardData) {
          continue
        }

        mapCards.push({ ...cardData })
      }

      for (let card of map.boss.cards || []) {
        const cardData = foundCards.find(c => c.name === card)
        if (!cardData) {
          continue
        }

        mapCards.push({ ...cardData, boss: true })
      }

      const totalWeight = mapCards.reduce((a, b) => a + b.weight, 0)
      let cardScore = 0

      for (let card of mapCards) {
        if (card.value) {
          const bossMulti = card.boss ? 5 : 1
          card.value = (card.price * card.weight) / bossMulti / totalWeight
          card.score = card.score / bossMulti
        }

        cardScore += card.score
      }

      cardScore = cardScore * cardInput

      return {
        ...map,
        cards: mapCards.sort((a, b) => b.price - a.price).sort((a, b) => b.value - a.value),
        value: layoutValue + densityValue + bossValue + cardScore
      }
    }),
    100
  )

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

  return rated
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

  const searchRef = useRef(null)
  const [searchInput, setSearchInput] = usePersistedState('searchInput', '', startTransition)
  const [layoutInput, setLayoutInput, layoutReset, layoutRef] = useInputField('layoutInput', 3, startTransition)
  const [densityInput, setDensityInput, densityReset, densityRef] = useInputField('densityInput', 2, startTransition)
  const [bossInput, setBossInput, bossReset, bossRef] = useInputField('bossInput', 1, startTransition)
  const [cardInput, setCardInput, cardReset, cardRef] = useInputField('cardWeightInput', 2, startTransition)
  const [cardBaselineInput, setCardBaselineInput, cardBaselineReset] = useInputField(
    'cardBaselineInput',
    defaultCardBaseline,
    startTransition
  )
  const [cardMinPriceInput, setCardMinPriceInput, cardMinPriceReset, cardMinPriceRef] = useInputField(
    'cardMinPriceInput',
    10,
    startTransition
  )
  const [hideLowValueCards, setHideLowValueCards] = usePersistedState('hideLowValueCards', false, startTransition)

  const cardWeightBaseline = useMemo(
    () => preparedCards.find(c => c.name === cardBaselineInput).weight,
    [cardBaselineInput]
  )
  const ratedCards = useMemo(() => rateCards(preparedCards, cardMinPriceInput), [cardMinPriceInput])
  const ratedMaps = useMemo(
    () => rateMaps(preparedMaps, ratedCards, layoutInput, densityInput, bossInput, cardInput),
    [ratedCards, layoutInput, densityInput, bossInput, cardInput]
  )
  const currentSearch = useMemo(() => parseSearch(searchInput), [searchInput])

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

  return (
    <>
      <Loader loading={isPending} />
      <ReactFlowProvider>
        <Atlas maps={ratedMaps} currentSearch={currentSearch} />
      </ReactFlowProvider>
      <div className="container-fluid p-4">
        <div className="row g-2">
          <div className="col col-lg-4 col-12">
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
          <div className="col col-lg-8 col-12">
            <div className="row g-2">
              <div className="col col-lg-3 col-sm-6 col-12">
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
              <div className="col col-lg-3 col-sm-6 col-12">
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
              <div className="col col-lg-3 col-sm-6 col-12">
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
              <div className="col col-lg-3 col-sm-6 col-12">
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
              <div className="col col-lg-3 col-sm-6 col-12">
                <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
                  <span className="tooltip-tag-text">
                    The baseline card drop you are expecting to see every map on average. This is used for calculating
                    baseline drop rate for cards in maps. Map baseline weight is calculated by averaging all map weights
                    and adding the average together with baseline weight.
                    <hr />
                    <span className="text-danger">
                      <b>Important:</b> Baseline weight is experimental feature and I am not sure if I am calculating it
                      correctly.
                    </span>
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
              <div className="col col-lg-3 col-sm-6 col-12">
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
            </div>
          </div>
        </div>
      </div>
      <table className="table table-striped mb-0">
        <thead>
          <tr>
            <th scope="col">
              <div className="d-md-flex justify-content-between align-items-end">
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
              <div className="d-md-flex justify-content-between align-items-end">
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
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    defaultChecked={hideLowValueCards}
                    onChange={() => setHideLowValueCards(!hideLowValueCards)}
                  />
                  <label className="form-check-label small">Hide cards under minimum price</label>
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {filterMaps(ratedMaps, currentSearch).map(m => (
            <tr key={m.name} id={m.name}>
              <Map
                map={m}
                cardWeightBaseline={cardWeightBaseline}
                hideLowValueCards={hideLowValueCards}
                currentSearch={currentSearch}
                addToInput={addToInput}
              />
            </tr>
          ))}
        </tbody>
      </table>
      <div className="container-fluid p-4 text-end">
        <div className="d-md-flex justify-content-between">
          <div>
            For raw data see:{' '}
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
