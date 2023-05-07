import 'bootstrap/dist/css/bootstrap.css'
import './App.css'
import {useState, useMemo} from 'react'
import debounce from 'lodash.debounce'
import cards from './data/cards.json'
import maps from './data/maps.json'
import alch from './img/alch.png'
import chaos from './img/chaos.png'
import exalt from './img/exalt.png'
import divine from './img/divine.png'
import Loader from './components/Loader'

const preparedCards = cards.map(card => {
  return {
    value: card.rate ? parseFloat(card.price) * parseFloat(card.rate) : null,
    ...card
  }
})

const preparedMaps = maps.map(map => {
  const mapCards = []

  for (let card of map.cards) {
    const cardData = preparedCards.find(c => c.name === card)
    if (cardData) {
      mapCards.push({
        ...cardData
      })
    } else {
      mapCards.push({
        name: card
      })
    }
  }

  const mapTags = []
  if (map.boss.separated) {
    mapTags.push("boss separated")
  }
  if (map.few_obstacles) {
    mapTags.push("few obstacles")
  }
  if (map.outdoors) {
    mapTags.push("outdoors")
  }
  if (map.linear) {
    mapTags.push("linear")
  }
  if (map.pantheon) {
    mapTags.push(map.pantheon)
  }

  return {
    ...map,
    cards: mapCards,
    tags: mapTags
  }
})

function tierColor(map) {
  const naturalTier = map.tiers[0]

  if (naturalTier >= 11) {
    return "text-danger"
  } else if (naturalTier >= 6) {
    return "text-warning"
  } else {
    return "text-light"
  }
}

const RatingBadge = ({ rating, inverse = false }) => {
  let badgeClass = "bg-danger"

  if (rating == null) {
    badgeClass = "bg-secondary"
    rating = "?"
  } else {
    const rat = inverse ? 10 - rating : rating
    if (rat >= 7) {
      badgeClass = "bg-success"
    } else if (rat >= 5) {
      badgeClass = "bg-info"
    } else if (rat >= 3) {
      badgeClass = "bg-warning"
    }
  }

  badgeClass = `badge text-dark ${badgeClass}`
  return <span className={badgeClass}>{rating}</span>
}

const MapTags = ({ tags }) => {
  return tags.map(t => <span className="badge rounded-pill text-dark bg-secondary me-1">{t}</span>)
}

const MapBoss = ({ boss }) => {
  const badge = <RatingBadge rating={boss.difficulty} inverse={true} />

  if (boss.names || boss.notes) {
    return <span className="tooltip-tag tooltip-tag-right">
      <span className="tooltip-tag-text">
        <p>
          {boss.names.map(b => <span className="badge text-dark bg-info me-1"><b>{b}</b></span>)}
        </p>
        {boss.notes}
      </span>
      {badge}
    </span>
  }

  return badge
}

const ConnectedMaps = ({ connected, ratedMaps }) => {
  return (connected || []).map(m => <span className="badge text-dark bg-secondary me-1">
    <b>{Math.round((ratedMaps.find(rm => rm.name.toLowerCase().trim() === m.toLowerCase().trim()) || {}).score || 0) + ' '}</b>
    {m}
  </span>)
}

const MapCard = ({ card }) => {
  let badgeClass = "bg-secondary"

  if (card.score >= 50) {
    badgeClass = "bg-danger"
  } else if (card.score >= 20) {
    badgeClass = "bg-warning"
  } else if (card.score >= 10) {
    badgeClass = "bg-info"
  } else if (card.score >= 2) {
    badgeClass = "bg-primary"
  }

  let img = alch

  if (card.price >= 100) {
    img = divine
  } else if (card.price >= 50) {
    img = exalt
  } else if (card.price >= 5) {
    img = chaos
  }

  badgeClass = `badge text-dark m-1 ${badgeClass}`
  return <span className="tooltip-tag tooltip-tag-left tooltip-tag-compact">
    <span className="tooltip-tag-text">
      <b>Price</b>: {card.price} <img src={chaos} alt="c" width="16" height="16"/>
      {card.rate && <><br/><b>* Rate</b>: {Math.round(card.rate * 10000) / 10000} %</>}
      {card.value > 0 && <><br/><b>= Score</b>: {Math.round(card.value * 100) / 100}</>}
    </span>
    <a className={badgeClass} href={card.ninja} target="_blank" rel="noreferrer">
     <img src={img} alt="" width="16" height="16" /> {card.name}
    </a>
  </span>
}

const MapCards = ({ cards, ratedCards }) => {
  return ratedCards
    .filter(c => cards.find(fc => fc.name === c.name))
    .map(c => <MapCard key={c.name} card={c}/>)
}

function calculateScore(dataset) {
  const nonzerodataset = dataset.filter(m => m.value !== undefined && m.value != null)
  const min = Math.min(...nonzerodataset.map(o => o.value))
  const max = Math.max(...nonzerodataset.map(o => o.value)) - min
  const out = []

  for (let entry of dataset) {
    if (entry.value) {
      out.push({
        ...entry,
        score: 100 * (entry.value - min) / max
      })
    } else {
      out.push(entry)
    }
  }

  return out
}

function mapAndRateCards(foundCards) {
  return calculateScore(foundCards)
    .sort((a, b) => b.price - a.price)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

function mapAndRateMaps(foundMaps, layoutInput, densityInput, bossInput, cardInput) {
  let out = []

  for (let map of foundMaps) {
    const layoutValue = (map.layout || 0) * layoutInput
    const densityValue = (map.density || 0) * densityInput
    const bossValue = (10 - (map.boss.difficulty || 10)) * bossInput
    let cardValue = 0

    for (let card of map.cards) {
      cardValue += (card.value || 0)
    }

    cardValue = cardValue * cardInput
    out.push({
      ...map,
      value: layoutValue + densityValue + bossValue + cardValue
    })
  }

  return calculateScore(out)
}

function filterMaps(ratedMaps, searchInput) {
  return ratedMaps
    .filter(m => !searchInput
      || m.name.toLowerCase().includes(searchInput.toLowerCase())
      || m.cards.find(c => c.name.toLowerCase().includes(searchInput.toLowerCase()))
      || m.tags.find(t => t.toLowerCase().includes(searchInput.toLowerCase()))
    )
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

const ratedCards = mapAndRateCards(preparedCards)

function App() {
  const [loading, setLoading] = useState(false)
  const withLoading = (val, callback) => {
    setLoading(val)
    return callback
  }

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useMemo(() => debounce(e => withLoading(false, setSearchInput)(e.target.value), 300), [])
  const startSearch = e => withLoading(true, debouncedSearch)(e)

  const [layoutInput, setLayoutInput] = useState('3')
  const debouncedLayout = useMemo(() => debounce(e => withLoading(false, setLayoutInput)(e.target.value), 300), [])
  const startLayout = e => withLoading(true, debouncedLayout)(e)

  const [densityInput, setDensityInput] = useState('2')
  const debouncedDensity = useMemo(() => debounce(e => withLoading(false, setDensityInput)(e.target.value), 300), [])
  const startDensity = e => withLoading(true, debouncedDensity)(e)

  const [bossInput, setBossInput] = useState('0.2')
  const debouncedBoss = useMemo(() => debounce(e => withLoading(false, setBossInput)(e.target.value), 300), [])
  const startBoss = e => withLoading(true, debouncedBoss)(e)

  const [cardInput, setCardInput] = useState('0.5')
  const debouncedCard = useMemo(() => debounce(e => withLoading(false, setCardInput)(e.target.value), 300), [])
  const startCard = e => withLoading(true, debouncedCard)(e)

  const ratedMaps = useMemo(() => mapAndRateMaps(preparedMaps, layoutInput, densityInput, bossInput, cardInput), [layoutInput, densityInput, bossInput, cardInput])

  return (
    <div className="bg-dark">
      <Loader loading={loading}/>
      <div className="container-fluid p-4">
        <div className="row">
          <div className="col">
            <label className="form-label text-light">Search</label>
            <input className="form-control bg-dark text-light" type="search" placeholder="Search for map name, tag or card" onChange={startSearch}/>
          </div>
          <div className="col">
            <label className="form-label text-light">Layout weight</label>
            <input className="form-control bg-dark text-light" type="number" placeholder={layoutInput} onChange={startLayout}/>
          </div>
          <div className="col">
            <label className="form-label text-light">Density weight</label>
            <input className="form-control bg-dark text-light" type="number" placeholder={densityInput} onChange={startDensity}/>
          </div>
          <div className="col">
            <label className="form-label text-light">Boss weight</label>
            <input className="form-control bg-dark text-light" type="number" placeholder={bossInput} onChange={startBoss}/>
          </div>
          <div className="col">
            <label className="form-label text-light">Card weight</label>
            <input className="form-control bg-dark text-light" type="number" placeholder={cardInput} onChange={startCard}/>
          </div>
        </div>
      </div>
      <table className="table table-dark table-striped mb-0">
        <thead>
        <tr>
          <th scope="col">
            <span className="tooltip-tag tooltip-tag-right">
              <span className="tooltip-tag-text">
                Sum of <b>Layout</b>, <b>Density</b>, <b>Boss</b> and <b>Card</b> score, accounting for weights at top.
              </span>
              Score
            </span>
          </th>
          <th scope="col">
            <span className="tooltip-tag tooltip-tag-right">
              <span className="tooltip-tag-text">
                Map name, colored based on natural tier (red, yellow, white).
              </span>
              Map
            </span>
          </th>
          <th scope="col">
            <span className="tooltip-tag tooltip-tag-right">
              <span className="tooltip-tag-text">
                How easy is the map to clear, e.g backtracking etc. Do not accounts for league mechanics, for that you probably want to look at outdoors tag.
              </span>
              Layout
            </span>
          </th>
          <th scope="col">
            <span className="tooltip-tag tooltip-tag-right">
              <span className="tooltip-tag-text">
                Monster count in maps. Do not counts for amount of monsters per square in map just total mob count.
              </span>
              Density
            </span>
          </th>
          <th scope="col">
            <span className="tooltip-tag tooltip-tag-right">
              <span className="tooltip-tag-text">
                Boss difficulty, e.g how scary it is to kill. This rating do not includes boss fight length (phases for example).
              </span>
              Boss
            </span>
          </th>
          <th scope="col">Connected Maps</th>
          <th scope="col">Cards</th>
        </tr>
        </thead>
        <tbody>
        {filterMaps(ratedMaps, searchInput).map(m =>
          <tr key={m.name}>
            <td className="text-center"><b>{Math.round(m.score || 0)}</b></td>
            <td>
              <a href={m.wiki} target="_blank" rel="noreferrer" className={tierColor(m)}>{m.name}</a>
              <br/>
              <MapTags tags={m.tags}/>
            </td>
            <td className="text-center"><RatingBadge rating={m.layout}/></td>
            <td className="text-center"><RatingBadge rating={m.density}/></td>
            <td className="text-center"><MapBoss boss={m.boss}/></td>
            <td><ConnectedMaps connected={m.connected} ratedMaps={ratedMaps}/></td>
            <td><MapCards cards={m.cards} ratedCards={ratedCards}/></td>
          </tr>
        )}
        </tbody>
      </table>
      <div className="container-fluid p-4 text-light text-end">
        Contribute on <a href="https://github.com/deathbeam/poe-tools" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </div>
  );
}

export default App;
