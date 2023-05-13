import 'bootstrap/dist/css/bootstrap.css'
import './App.css'
import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import alch from './img/alch.png'
import chaos from './img/chaos.png'
import exalt from './img/exalt.png'
import divine from './img/divine.png'
import {
  cardBossMulti,
  defaultCardBaseline,
  githubRepo,
  issueTemplate,
  preparedCards,
  preparedMaps,
  preparedTags
} from './data'
import Loader from './components/Loader'
import SelectSearch from 'react-select-search'

function rescale(value, minValue, maxValue, scale) {
  return Math.round(Math.min((scale * (value - minValue)) / (maxValue - minValue), scale) * 10) / 10
}

export function calculateScore(dataset, range) {
  const nonzerodataset = dataset.filter(m => m.value !== undefined && m.value != null)
  const min = Math.min(...nonzerodataset.map(o => o.value))
  const max = Math.max(...nonzerodataset.map(o => o.value))
  const out = []

  for (let entry of dataset) {
    if (entry.value) {
      out.push({
        ...entry,
        score: rescale(entry.value, min, max, range)
      })
    } else {
      out.push(entry)
    }
  }

  return out.sort((a, b) => (b.score || 0) - (a.score || 0))
}

function rateCards(cards, cardWeightBaseline, cardMinPrice) {
  return calculateScore(
    cards
      .map(card => {
        let rate = 0
        if (card.price >= cardMinPrice) {
          rate = card.weight / cardWeightBaseline
        }

        return {
          ...card,
          value: rate * card.price * (card.boss ? 1 / cardBossMulti : 1)
        }
      })
      .sort((a, b) => b.price - a.price),
    10
  )
}

function rateMaps(foundMaps, ratedCards, layoutInput, densityInput, bossInput, cardInput) {
  return calculateScore(
    foundMaps.map(map => {
      const layoutValue = (map.rating.layout || 0) * layoutInput
      const densityValue = (map.rating.density || 0) * densityInput
      const bossValue = (map.rating.boss || 0) * bossInput
      let cardValue = 0

      const mapCards = []

      for (let card of map.cards) {
        const cardData = ratedCards.find(c => c.name === card)
        if (!cardData) {
          continue
        }

        mapCards.push({
          ...cardData
        })

        cardValue += cardData.value || 0
      }

      cardValue = cardValue * cardInput
      return {
        ...map,
        cards: mapCards,
        value: layoutValue + densityValue + bossValue + cardValue
      }
    }),
    100
  )
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

function filter(search, v) {
  let posMatched = true
  let negMatched = true

  for (let s of search) {
    if (s.neg) {
      negMatched = negMatched && !v.some(m => m.trim().toLowerCase().includes(s.value))
    } else {
      posMatched = posMatched && v.some(m => m.trim().toLowerCase().includes(s.value))
    }
  }

  return posMatched && negMatched
}

function filterMaps(ratedMaps, currentSearch) {
  return ratedMaps.filter(m => !currentSearch || filter(currentSearch, m.search))
}

function useTransitionState(key, def, startTransition) {
  const [val, setVal] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item && item !== '' ? JSON.parse(item) : def
    } catch (e) {
      console.warn(e)
      return def
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val))
    } catch (e) {
      console.warn(e)
    }
  }, [key, val])

  return [val, e => startTransition(() => setVal(e.target.value === '' ? def : e.target.value))]
}

const RatingBadge = ({ rating, tooltip }) => {
  let badgeClass = 'bg-danger'

  if (rating == null) {
    badgeClass = 'bg-secondary'
    rating = '?'
  } else {
    if (rating >= 7) {
      badgeClass = 'bg-success'
    } else if (rating >= 5) {
      badgeClass = 'bg-info'
    } else if (rating >= 3) {
      badgeClass = 'bg-warning'
    }
  }

  badgeClass = `badge text-dark ${badgeClass}`
  const badge = <span className={badgeClass}>{rating}</span>

  if (tooltip) {
    return (
      <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
        <span className="tooltip-tag-text">{tooltip}</span>
        {badge}
      </span>
    )
  }

  return badge
}

const Tags = ({ tags, currentSearch, addToInput }) => {
  return tags.map(t => {
    const val = t.name
    const info = t.info

    const searched = currentSearch.find(c => c.value === val)
    let color = 'btn-secondary'
    if (searched) {
      color = searched.neg ? 'btn-danger' : 'btn-success'
    }

    const buttons = []
    buttons.push(
      <button
        className={'btn text-dark ' + color}
        onClick={() => addToInput(val, searched ? !searched.neg : false, false)}
      >
        {val} {info && <b>*</b>}
      </button>
    )

    if (searched) {
      buttons.push(
        <button className={'btn text-dark btn-warning'} onClick={() => addToInput(val, searched.neg, true)}>
          <b>X</b>
        </button>
      )
    }

    return info ? (
      <span className="tooltip-tag tooltip-tag-right">
        <span className="tooltip-tag-text tooltip-tag-fill">{info}</span>
        <div className="btn-group btn-group-sm m-1">{buttons}</div>
      </span>
    ) : (
      <div class="btn-group btn-group-sm m-1">{buttons}</div>
    )
  })
}

const MapName = ({ map, currentSearch, addToInput }) => {
  const mapImage =
    process.env.PUBLIC_URL +
    '/layout/' +
    map.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replaceAll(' ', '_') +
    '.png'

  const tier = map.tiers[0]
  let tierColor = 'text-light'
  if (tier >= 11) {
    tierColor = 'text-danger'
  } else if (tier >= 6) {
    tierColor = 'text-warning'
  }

  const name = (
    <a href={map.wiki} target="_blank" rel="noreferrer" className={tierColor}>
      {map.name}
    </a>
  )
  const tags = <Tags tags={map.tags} currentSearch={currentSearch} addToInput={addToInput} />

  return map.image ? (
    <>
      <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
        <span className="tooltip-tag-text tooltip-tag-fill">
          <img src={mapImage} alt="" loading="lazy" />
        </span>
        {name}
      </span>
      <br />
      <small>{map.tiers.join(', ')}</small>
      <br />
      {tags}
    </>
  ) : (
    <>
      {name}
      <br />
      <small>{map.tiers.join(', ')}</small>
      <br />
      {tags}
    </>
  )
}

const MapBoss = ({ boss, rating }) => {
  const badge = <RatingBadge rating={rating} />

  if (boss.names || boss.notes) {
    return (
      <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
        <span className="tooltip-tag-text">
          {boss.names &&
            boss.names.map(b => (
              <b>
                {b}
                <br />
              </b>
            ))}
          {boss.notes}
        </span>
        {badge}
      </span>
    )
  }

  return badge
}

const ConnectedMaps = ({ connected, ratedMaps }) => {
  return (connected || []).map(m => (
    <>
      <a className="badge text-dark bg-secondary me-1" href={'#' + m}>
        <b>
          {Math.round(
            (ratedMaps.find(rm => rm.name.toLowerCase().trim() === m.toLowerCase().trim()) || {}).score || 0
          ) + ' '}
        </b>
        {m}
      </a>
      <br />
    </>
  ))
}

const MapCard = ({ card, cardWeightBaseline }) => {
  let badgeClass = 'bg-secondary text-dark'

  if (card.score >= 8) {
    badgeClass = 'bg-light text-dark'
  } else if (card.score >= 5) {
    badgeClass = 'bg-primary text-light'
  } else if (card.score >= 2) {
    badgeClass = 'bg-info text-dark'
  } else if (card.score >= 0.5) {
    badgeClass = 'bg-dark text-info border border-1 border-info'
  }

  let img = alch

  if (card.price >= 100) {
    img = divine
  } else if (card.price >= 50) {
    img = exalt
  } else if (card.price >= 5) {
    img = chaos
  }

  badgeClass = `badge m-1 ${badgeClass}`
  return (
    <span className="tooltip-tag tooltip-tag-left tooltip-tag-compact">
      <span className="tooltip-tag-text">
        <b>Reward</b>: {card.reward}
        <br />
        <b>Stack size</b>: {card.stack}
        <br />
        <b>Price</b>: {card.price} <img src={chaos} alt="c" width="16" height="16" />
        {card.value > 0 ? (
          <>
            <br />
            <b>* Weight</b>: {card.weight}
            <br />
            <b>/ Baseline</b>: {cardWeightBaseline}
            {card.boss && (
              <>
                <br />
                <b>/ Boss drop</b>: {cardBossMulti}
              </>
            )}
            <br />
            <b>= Value</b>: {Math.round(card.value * 1000) / 1000} <img src={chaos} alt="c" width="16" height="16" />
            <br />
            <b>= Score</b>: {card.score}
          </>
        ) : (
          <>
            <br />
            <b>Weight</b>: {card.weight}
          </>
        )}
      </span>
      <a className={badgeClass} href={card.ninja} target="_blank" rel="noreferrer">
        <img src={img} alt="" width="16" height="16" /> {card.name}
      </a>
    </span>
  )
}

const MapCards = ({ cards, cardWeightBaseline, hideLowValueCards }) => {
  const avg = Math.round(cards.reduce((a, b) => a + b.value, 0) * 100) / 100

  return (
    <div className="row g-0">
      <div className="col-md-1 d-md-flex justify-content-end">
        <span className="p-2 d-md-flex">
          {avg}
          <img src={chaos} alt="c" width="16" height="16" className="m-1" />
        </span>
      </div>
      <div className="col-md-11">
        {cards
          .sort((a, b) => b.price - a.price)
          .sort((a, b) => b.score - a.score)
          .filter(c => !hideLowValueCards || c.value > 0)
          .map(c => (
            <MapCard card={c} cardWeightBaseline={cardWeightBaseline} />
          ))}
      </div>
    </div>
  )
}

function App() {
  const [isPending, startTransition] = useTransition()

  const searchRef = useRef(null)
  const [searchInput, setSearchInput] = useTransitionState('searchInput', '', startTransition)
  const [layoutInput, setLayoutInput] = useTransitionState('layoutInput', 3, startTransition)
  const [densityInput, setDensityInput] = useTransitionState('densityInput', 2, startTransition)
  const [bossInput, setBossInput] = useTransitionState('bossInput', 1, startTransition)
  const [cardInput, setCardInput] = useTransitionState('cardWeightInput', 2, startTransition)
  const [hideLowValueCards, setHideLowValueCards] = useTransitionState('hideLowValueCards', false, startTransition)
  const [cardBaselineInput, setCardBaselineInput] = useTransitionState(
    'cardBaselineInput',
    defaultCardBaseline,
    startTransition
  )
  const [cardMinPriceInput, setCardMinPriceInput] = useTransitionState('cardMinPriceInput', 10, startTransition)
  const cardWeightBaseline = useMemo(
    () => preparedCards.find(c => c.name === cardBaselineInput).weight,
    [cardBaselineInput]
  )

  const ratedCards = useMemo(
    () => rateCards(preparedCards, cardWeightBaseline, cardMinPriceInput),
    [cardWeightBaseline, cardMinPriceInput]
  )

  const ratedMaps = useMemo(
    () => rateMaps(preparedMaps, ratedCards, layoutInput, densityInput, bossInput, cardInput),
    [ratedCards, layoutInput, densityInput, bossInput, cardInput]
  )

  const currentSearch = parseSearch(searchInput)

  const setSearch = v => {
    searchRef.current.value = v
    setSearchInput({
      target: {
        value: v
      }
    })
  }

  const addToInput = (v, neg, remove) => {
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

    setSearch(buildSearch(s))
  }

  return (
    <>
      <Loader loading={isPending} />
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
                <input
                  className="form-control"
                  type="number"
                  placeholder={layoutInput}
                  defaultValue={layoutInput}
                  onChange={setLayoutInput}
                />
              </div>
              <div className="col col-lg-3 col-sm-6 col-12">
                <label className="form-label">Density weight</label>
                <input
                  className="form-control"
                  type="number"
                  placeholder={densityInput}
                  defaultValue={densityInput}
                  onChange={setDensityInput}
                />
              </div>
              <div className="col col-lg-3 col-sm-6 col-12">
                <label className="form-label">Boss weight</label>
                <input
                  className="form-control"
                  type="number"
                  placeholder={bossInput}
                  defaultValue={bossInput}
                  onChange={setBossInput}
                />
              </div>
              <div className="col col-lg-3 col-sm-6 col-12">
                <label className="form-label">Card weight</label>
                <input
                  className="form-control"
                  type="number"
                  placeholder={cardInput}
                  defaultValue={cardInput}
                  onChange={setCardInput}
                />
              </div>
              <div className="col col-lg-3 col-sm-6 col-12">
                <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
                  <span className="tooltip-tag-text">
                    The baseline card drop you are expecting to see every map. The drop chance per map for other cards
                    is derived from this one.
                    <br />
                    So for example with the default <b>{defaultCardBaseline}</b> baseline you can expect to see{' '}
                    <b>The Patient</b> around every <b>13</b> maps.
                    <br />
                    <b>{defaultCardBaseline}</b> baseline is good to simulate unoptimized atlas setup not focused on
                    farming cards.
                  </span>
                  <label className="form-label">Average card drop per map</label>
                </span>
                <SelectSearch
                  options={preparedCards
                    .sort((a, b) => b.weight - a.weight)
                    .map(c => ({ name: c.name + ' (' + c.weight + ')', value: c.name }))}
                  value={cardBaselineInput}
                  onChange={e => setCardBaselineInput({ target: { value: e } })}
                  search="true"
                />
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
                    Minimum card drop price (in <img src={chaos} alt="c" width="16" height="16" />)
                  </label>
                </span>
                <input
                  className="form-control"
                  type="number"
                  placeholder={cardMinPriceInput}
                  defaultValue={cardMinPriceInput}
                  onChange={setCardMinPriceInput}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <table className="table table-striped mb-0">
        <thead>
          <tr>
            <th scope="col">
              <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
                <span className="tooltip-tag-text">
                  Sum of <b>Layout</b>, <b>Density</b>, <b>Boss</b> and <b>Card</b> score, accounting for weights at
                  top.
                </span>
                Score
              </span>
            </th>
            <th scope="col">
              <div className="d-md-flex justify-content-between align-items-end">
                <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
                  <span className="tooltip-tag-text">
                    Map name, colored based on natural tier with map tiers for each Voidstone next to it.
                    <br />
                    <span className="badge bg-light text-dark me-1">tier 1-5</span>
                    <span className="badge bg-warning text-dark me-1">tier 6-10</span>
                    <span className="badge bg-danger text-dark me-1">tier 11-16</span>
                  </span>
                  Map
                </span>
                <div>
                  <small>
                    <a href={issueTemplate} target="_blank" rel="noreferrer">
                      Data not valid or missing? Click here
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
                  <br />
                  <span className="badge bg-secondary text-dark me-1">unknown</span>
                  <span className="badge bg-danger text-dark me-1">bad</span>
                  <span className="badge bg-warning text-dark me-1">>=3 neutral</span>
                  <span className="badge bg-info text-dark me-1">>=5 good</span>
                  <span className="badge bg-success text-dark me-1">>=7 great</span>
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
                  <br />
                  <span className="badge bg-secondary text-dark me-1">unknown</span>
                  <span className="badge bg-danger text-dark me-1">bad</span>
                  <span className="badge bg-warning text-dark me-1">>=3 neutral</span>
                  <span className="badge bg-info text-dark me-1">>=5 good</span>
                  <span className="badge bg-success text-dark me-1">>=7 great</span>
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
                  <br />
                  <span className="badge bg-secondary text-dark me-1">unknown</span>
                  <span className="badge bg-danger text-dark me-1">hard/annoying</span>
                  <span className="badge bg-warning text-dark me-1">>=3 neutral</span>
                  <span className="badge bg-info text-dark me-1">>=5 alright</span>
                  <span className="badge bg-success text-dark me-1">>=7 easy/fast</span>
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
                    <b>{cardMinPriceInput}c</b> are filtered out from rating. Value calculation assumes that you drop{' '}
                    <b>1 {cardBaselineInput}</b> per map on average and derives the chance to drop other cards from
                    that.
                    <br />
                    <span className="badge bg-secondary text-dark me-1">not very good</span>
                    <span className="badge bg-dark border border-1 border-info text-info me-1">>=0.5 decent</span>
                    <span className="badge bg-info text-dark me-1">>=2 good</span>
                    <span className="badge bg-primary text-light me-1">>=5 great</span>
                    <span className="badge bg-light text-dark me-1">>=8 amazing</span>
                  </span>
                  Cards
                </span>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    defaultChecked={hideLowValueCards}
                    onChange={() =>
                      setHideLowValueCards({
                        target: { value: !hideLowValueCards }
                      })
                    }
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
              <td className="text-center">
                <div className=" d-none d-md-table-cell">
                  <b>{Math.round(m.score || 0)}</b>
                </div>
                <div className="d-block d-md-none">
                  <b>Total</b>: {Math.round(m.score || 0)}
                  <br />
                  <b>Layout</b>: <RatingBadge rating={m.rating.layout} />
                  <br />
                  <b>Density</b>: <RatingBadge rating={m.rating.density} />
                  <br />
                  <b>Boss</b>: <RatingBadge rating={m.rating.boss} />
                  <br />
                </div>
              </td>
              <td>
                <MapName map={m} currentSearch={currentSearch} addToInput={addToInput} />
              </td>
              <td className="text-center d-none d-md-table-cell">
                <RatingBadge rating={m.rating.layout} />
              </td>
              <td className="text-center d-none d-md-table-cell">
                <RatingBadge
                  rating={m.rating.density}
                  tooltip={m.rating.density_unreliable && 'Missing exact mob count, density rating might be unreliable'}
                />
              </td>
              <td className="text-center d-none d-md-table-cell">
                <MapBoss boss={m.boss} rating={m.rating.boss} />
              </td>
              <td>
                <ConnectedMaps connected={m.connected} ratedMaps={ratedMaps} />
              </td>
              <td>
                <MapCards
                  cards={m.cards}
                  cardWeightBaseline={cardWeightBaseline}
                  hideLowValueCards={hideLowValueCards}
                />
              </td>
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
    </>
  )
}

export default App
