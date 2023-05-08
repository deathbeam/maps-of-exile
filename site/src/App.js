import 'bootstrap/dist/css/bootstrap.css'
import './App.css'
import {useState, useMemo, useTransition} from 'react'
import merge from 'lodash.merge'
import cards from './data/cards.json'
import maps from './data/maps.json'
import maps_extra from './data/maps_extra.json'
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
}).sort((a, b) => b.price - a.price)
  .sort((a, b) => (b.value || 0) - (a.value || 0))

const preparedMaps = maps.map(map => {
  const mapExtra = maps_extra.find(m => m.name === map.name)
  if (mapExtra) {
    map = merge(map, mapExtra)
  }

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
  if (map.layout.few_obstacles) {
    mapTags.push("few obstacles")
  }
  if (map.layout.outdoors) {
    mapTags.push("outdoors")
  }
  if (map.layout.linear) {
    mapTags.push("linear")
  }
  if (map.pantheon) {
    mapTags.push(map.pantheon.toLowerCase())
  }
  if (map.layout.good_for_open_mechanics) {
    mapTags.push("+league mechanics")
  }
  if (map.layout.good_for_deli_mirror) {
    mapTags.push("+delirium mirror")
  }

  if (map.boss.names) {
    const names = map.boss.names.filter(n => !n.includes('Merveil'))
    if (names.length > 1) {
      mapTags.push(`${names.length} bosses`)
    }
  }
  if (map.boss.separated) {
    mapTags.push("boss separated")
  }
  if (map.filled) {
    if (!map.boss.spawn_at_load) {
      mapTags.push("boss not spawned")
    }
    if (map.boss.close_to_start) {
      mapTags.push("boss rushable")
    }
    if (map.boss.phases) {
      mapTags.push("-boss with phases")
    }
  }

  return {
    ...map,
    name: map.name.replace(" Map", ""),
    connected: (map.connected || []).map(c => c.replace(" Map", "")),
    cards: mapCards,
    tags: mapTags,
  }
})

const possibleTags = [...new Set(preparedMaps
  .flatMap(m => m.tags)
  .map(t => t.replace(/\d+ bosses/, "bosses"))
  .map(t => t.replace(/soul of .+/, "soul of"))
)].sort()

const RatingBadge = ({ rating }) => {
  let badgeClass = "bg-danger"

  if (rating == null) {
    badgeClass = "bg-secondary"
    rating = "?"
  } else {
    if (rating >= 7) {
      badgeClass = "bg-success"
    } else if (rating >= 5) {
      badgeClass = "bg-info"
    } else if (rating >= 3) {
      badgeClass = "bg-warning"
    }
  }

  badgeClass = `badge text-dark ${badgeClass}`
  return <span className={badgeClass}>{rating}</span>
}

const Tags = ({ tags }) => {
  return tags.map(t => {
    const color = t.startsWith("+") ? "bg-info" : t.startsWith("-") ? "bg-warning" : "bg-secondary"
    const clazz = "badge rounded-pill text-dark me-1 " + color
    return <span className={clazz}>{t}</span>
  })
}

const MapName = ({ map }) => {
  const mapImage = process.env.PUBLIC_URL + "/layout/" + map.name.toLowerCase().replaceAll(" ", "_") + ".png"
  let tierColor = "text-light"
  if (map.tier >= 11) {
    tierColor = "text-danger"
  } else if (map.tier >= 6) {
    tierColor = "text-warning"
  }

  const name = <a href={map.wiki} target="_blank" rel="noreferrer" className={tierColor}>{map.name}</a>
  const tags = <Tags tags={map.tags}/>

  return map.filled ? <>
    <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
      <span className="tooltip-tag-text tooltip-tag-fill">
        <img src={mapImage} alt="" loading="lazy"/>
      </span>
      {name}
    </span>
    <br/>
    {tags}
  </> : <>
    {name}
    <br/>
    {tags}
  </>
}

const MapBoss = ({ boss, rating }) => {
  const badge = <RatingBadge rating={rating} />

  if (boss.names || boss.notes) {
    return <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
      <span className="tooltip-tag-text">
        {boss.names.map(b => <b>{b}<br/></b>)}
        {boss.notes}
      </span>
      {badge}
    </span>
  }

  return badge
}

const ConnectedMaps = ({ connected, ratedMaps }) => {
  return (connected || []).map(m => <><span className="badge text-dark bg-secondary me-1">
    <b>{Math.round((ratedMaps.find(rm => rm.name.toLowerCase().trim() === m.toLowerCase().trim()) || {}).score || 0) + ' '}</b>
    {m}
  </span><br/></>)
}

const MapCard = ({ card }) => {
  let badgeClass = "bg-secondary"

  if (card.value >= 20) {
    badgeClass = "bg-danger"
  } else if (card.value >= 10) {
    badgeClass = "bg-warning"
  } else if (card.value >= 5) {
    badgeClass = "bg-info"
  } else if (card.value >= 1) {
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

const MapCards = ({ cards }) => {
  return preparedCards
    .filter(c => cards.find(fc => fc.name === c.name))
    .map(c => <MapCard card={c}/>)
}

function rescale(value, minValue, maxValue, scale) {
  return Math.min(scale * (value - minValue) / (maxValue - minValue), scale)
}

function calculateScore(dataset) {
  const nonzerodataset = dataset.filter(m => m.value !== undefined && m.value != null)
  const min = Math.min(...nonzerodataset.map(o => o.value))
  const max = Math.max(...nonzerodataset.map(o => o.value))
  const out = []

  for (let entry of dataset) {
    if (entry.value) {
      out.push({
        ...entry,
        score: rescale(entry.value, min, max, 100)
      })
    } else {
      out.push(entry)
    }
  }

  return out
}

function mapAndRateMaps(foundMaps, layoutInput, densityInput, bossInput, cardInput) {
  let out = []

  for (let map of foundMaps) {
    const layoutValue = (map.rating.layout || 0) * layoutInput
    const densityValue = (map.rating.density || 0) * densityInput
    const bossValue = (map.rating.boss || 0) * bossInput
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

function App() {
  const [isPending, startTransition] = useTransition()

  const useTransitionState = (def) => {
    const [val, setVal] = useState(def)
    return [val, (e) => startTransition(() => setVal(e.target.value))]
  }

  const [searchInput, setSearchInput] = useTransitionState('')
  const [layoutInput, setLayoutInput] = useTransitionState('3')
  const [densityInput, setDensityInput] = useTransitionState('2')
  const [bossInput, setBossInput] = useTransitionState('1')
  const [cardInput, setCardInput] = useTransitionState('0.5')
  const ratedMaps = useMemo(() => mapAndRateMaps(preparedMaps, layoutInput, densityInput, bossInput, cardInput), [layoutInput, densityInput, bossInput, cardInput])

  return (
    <>
      <Loader loading={isPending}/>
      <div className="container-fluid p-4">
        <div className="row">
          <div className="col col-4">
            <div className="input-group">
              <div className="input-group-text">Search</div>
              <input className="form-control" type="search" placeholder="Search for map name, tag or card" onChange={setSearchInput}/>
            </div>
            <span className="small">tags:</span> <Tags tags={possibleTags}/>
          </div>
          <div className="col">
            <div className="input-group">
              <div className="input-group-text">Layout weight</div>
              <input className="form-control" type="number" placeholder={layoutInput} onChange={setLayoutInput}/>
            </div>
          </div>
          <div className="col">
            <div className="input-group">
              <div className="input-group-text">Density weight</div>
              <input className="form-control" type="number" placeholder={densityInput} onChange={setDensityInput}/>
            </div>
          </div>
          <div className="col">
            <div className="input-group">
              <div className="input-group-text">Boss weight</div>
              <input className="form-control" type="number" placeholder={bossInput} onChange={setBossInput}/>
            </div>
          </div>
          <div className="col">
            <div className="input-group">
              <div className="input-group-text">Card weight</div>
              <input className="form-control" type="number" placeholder={cardInput} onChange={setCardInput}/>
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
                Sum of <b>Layout</b>, <b>Density</b>, <b>Boss</b> and <b>Card</b> score, accounting for weights at top.
              </span>
              Score
            </span>
          </th>
          <th scope="col">
            <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
              <span className="tooltip-tag-text">
                Map name, colored based on natural tier.
                <br/>
                <span className="badge bg-light text-dark me-1">tier 1-5</span>
                <span className="badge bg-warning text-dark me-1">tier 6-10</span>
                <span className="badge bg-danger text-dark me-1">tier 11-16</span>
              </span>
              Map
            </span>
          </th>
          <th scope="col">
            <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
              <span className="tooltip-tag-text">
                How straightforward is the map to clear or how good it is for league mechanics.
                <br/>
                <span className="badge bg-secondary text-dark me-1">unknown</span>
                <span className="badge bg-danger text-dark me-1">bad</span>
                <span className="badge bg-warning text-dark me-1">>=3 neutral</span>
                <span className="badge bg-info text-dark me-1">>=5 good</span>
                <span className="badge bg-success text-dark me-1">>=7 great</span>
              </span>
              Layout
            </span>
          </th>
          <th scope="col">
            <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
              <span className="tooltip-tag-text">
                How many total mobs does the map have.
                <br/>
                <span className="badge bg-secondary text-dark me-1">unknown</span>
                <span className="badge bg-danger text-dark me-1">bad</span>
                <span className="badge bg-warning text-dark me-1">>=3 neutral</span>
                <span className="badge bg-info text-dark me-1">>=5 good</span>
                <span className="badge bg-success text-dark me-1">>=7 great</span>
              </span>
              Density
            </span>
          </th>
          <th scope="col">
            <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
              <span className="tooltip-tag-text">
                How annoying/dangerous is the boss to kill.
                <br/>
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
              <span className="tooltip-tag-text">
                Maps adjacent to this map on atlas with score on left.
              </span>
              Connected
            </span>
          </th>
          <th scope="col">
            <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
              <span className="tooltip-tag-text">
                Cards that drop in the map sorted by <b>drop rate</b> and <b>price</b>. This means that even though card might be more expensive,
                it might not necessarily be higher priority because of its lower drop rate.
                <br/>
                <span className="badge bg-secondary text-dark me-1">not very good</span>
                <span className="badge bg-primary text-dark me-1">>=1 decent</span>
                <span className="badge bg-info text-dark me-1">>=5 good</span>
                <span className="badge bg-warning text-dark me-1">>=10 great</span>
                <span className="badge bg-danger text-dark me-1">>=20 amazing</span>
              </span>
              Cards
            </span>
          </th>
        </tr>
        </thead>
        <tbody>
          {filterMaps(ratedMaps, searchInput).map(m =>
            <tr key={m.name}>
              <td className="text-center"><b>{Math.round(m.score || 0)}</b></td>
              <td><MapName map={m}/></td>
              <td className="text-center"><RatingBadge rating={m.rating.layout}/></td>
              <td className="text-center"><RatingBadge rating={m.rating.density}/></td>
              <td className="text-center"><MapBoss boss={m.boss} rating={m.rating.boss}/></td>
              <td><ConnectedMaps connected={m.connected} ratedMaps={ratedMaps}/></td>
              <td><MapCards cards={m.cards}/></td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="container-fluid p-4 text-end">
        Contribute on <a href="https://github.com/deathbeam/poe-tools" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </>
  );
}

export default App;
