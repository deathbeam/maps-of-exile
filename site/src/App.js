import 'bootstrap/dist/css/bootstrap.css'
import './App.css'
import {useState, useMemo, useTransition, useRef, useEffect} from 'react'
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
}).sort((a, b) => b.price - a.price)
  .sort((a, b) => (b.value || 0) - (a.value || 0))

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
  if (map.boss.not_spawned) {
    mapTags.push("boss not spawned")
  }
  if (map.boss.close_to_start) {
    mapTags.push("boss rushable")
  }
  if (map.boss.phases) {
    mapTags.push("-boss with phases")
  }
  if (map.boss.soft_phases) {
    mapTags.push("boss with soft phases")
  }

  return {
    ...map,
    name: map.name.replace(" Map", ""),
    connected: (map.connected || []).map(c => c.replace(" Map", "")),
    cards: mapCards,
    tags: mapTags.sort(),
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

const Tags = ({ tags, currentInput, addToInput }) => {
  return tags.map(t => {
    const searched = currentInput.toLowerCase().includes(t)
    const color = searched ? "bg-primary" : t.startsWith("+") ? "bg-success" : t.startsWith("-") ? "bg-danger" : "bg-secondary"
    const suff = searched ? <>{' '}<span className="text-danger-emphasis">x</span></> : null
    const clazz = "badge rounded-pill text-dark me-1 " + color
    return <button className={clazz} onClick={() => addToInput(t)}>{t}{suff}</button>
  })
}

const MapName = ({ map, currentInput, addToInput }) => {
  const mapImage = process.env.PUBLIC_URL + "/layout/" + map.name.toLowerCase().replaceAll(" ", "_") + ".png"
  let tierColor = "text-light"
  if (map.tier >= 11) {
    tierColor = "text-danger"
  } else if (map.tier >= 6) {
    tierColor = "text-warning"
  }

  const name = <a href={map.wiki} target="_blank" rel="noreferrer" className={tierColor}>{map.name}</a>
  const tags = <Tags tags={map.tags} currentInput={currentInput} addToInput={addToInput}/>

  return map.image ? <>
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
  return (connected || []).map(m => <><a className="badge text-dark bg-secondary me-1" href={'#' + m}>
    <b>{Math.round((ratedMaps.find(rm => rm.name.toLowerCase().trim() === m.toLowerCase().trim()) || {}).score || 0) + ' '}</b>
    {m}
  </a><br/></>)
}

const MapCard = ({ card }) => {
  let badgeClass = "bg-secondary text-dark"

  if (card.value >= 20) {
    badgeClass = "bg-light text-dark"
  } else if (card.value >= 10) {
    badgeClass = "bg-primary text-light"
  } else if (card.value >= 5) {
    badgeClass = "bg-info text-dark"
  } else if (card.value >= 1) {
    badgeClass = "bg-dark text-info border border-1 border-info"
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
  return <span className="tooltip-tag tooltip-tag-left tooltip-tag-compact">
    <span className="tooltip-tag-text">
      <b>Reward</b>: {card.reward}<br/>
      <b>Stack size</b>: {card.stack}<br/>
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
  const split = (searchInput || "").split(",").filter(e => e.trim())
  return ratedMaps
    .filter(m => !searchInput
      || split.find(s => m.name.toLowerCase().includes(s.trim().toLowerCase()))
      || m.cards.find(c => split.find(s => c.name.toLowerCase().includes(s.trim().toLowerCase())))
      || split.every(s => m.tags.find(t => t.toLowerCase().includes(s.trim().toLowerCase())))
    )
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

function App() {
  const [isPending, startTransition] = useTransition()

  const useTransitionState = (key, def) => {
    const [val, setVal] = useState(() => {
      try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : def
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
    }, [val])

    return [val, (e) => startTransition(() => setVal(e.target.value))]
  }

  const searchRef = useRef(null)
  const [searchInput, setSearchInput] = useTransitionState('searchInput', '')
  const [layoutInput, setLayoutInput] = useTransitionState('layoutInput',  '3')
  const [densityInput, setDensityInput] = useTransitionState('densityInput', '2')
  const [bossInput, setBossInput] = useTransitionState('bossInput', '1')
  const [cardInput, setCardInput] = useTransitionState('cardInput', '0.5')
  const ratedMaps = useMemo(() => mapAndRateMaps(preparedMaps, layoutInput, densityInput, bossInput, cardInput), [layoutInput, densityInput, bossInput, cardInput])

  const setSearch = (v) => {
    searchRef.current.value = v
    setSearchInput({
      target: {
        value: v
      }
    })
  }

  const addToInput = (v) => {
    const inS = searchRef.current.value
    if (!inS) {
      setSearch(v)
    } else if (!inS.includes(v)) {
      setSearch(inS + ", " + v)
    } else {
      setSearch(inS
        .replace(", " + v, "")
        .replace("," + v, "")
        .replace(v + ", ", "")
        .replace(v + ",", "")
        .replace(v, ""))
    }
  }

  return (
    <>
      <Loader loading={isPending}/>
      <div className="container-fluid p-4">
        <div className="row g-2">
          <div className="col col-lg-4 col-12">
            <label className="form-label">Search</label>
            <input className="form-control" type="search" placeholder="Search for map name, tag or card, comma separated" ref={searchRef} defaultValue={searchInput} onChange={setSearchInput}/>
            <span className="small">tags:</span> <Tags tags={possibleTags} currentInput={searchInput} addToInput={addToInput}/>
          </div>
          <div className="col col-lg-8 col-12">
            <div className="row g-2">
              <div className="col col-lg-3 col-sm-6 col-12">
                <label className="form-label">Layout weight</label>
                <input className="form-control" type="number" placeholder={layoutInput} onChange={setLayoutInput}/>
              </div>
              <div className="col col-lg-3 col-sm-6 col-12">
                <label className="form-label">Density weight</label>
                <input className="form-control" type="number" placeholder={densityInput} onChange={setDensityInput}/>
              </div>
              <div className="col col-lg-3 col-sm-6 col-12">
                <label className="form-label">Boss weight</label>
                <input className="form-control" type="number" placeholder={bossInput} onChange={setBossInput}/>
              </div>
              <div className="col col-lg-3 col-sm-6 col-12">
                <label className="form-label">Card weight</label>
                <input className="form-control" type="number" placeholder={cardInput} onChange={setCardInput}/>
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
          <th scope="col" className="d-none d-md-table-cell">
            <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
              <span className="tooltip-tag-text">
                Maps adjacent to this map on atlas with score on left.
              </span>
              Connected
            </span>
          </th>
          <th scope="col">
            <span className="tooltip-tag tooltip-tag-left tooltip-tag-notice">
              <span className="tooltip-tag-text">
                Cards that drop in the map sorted by <b>drop rate</b> and <b>price</b>. This means that even though card might be more expensive,
                it might not necessarily be higher priority because of its lower drop rate.
                <br/>
                <span className="badge bg-secondary text-dark me-1">not very good</span>
                <span className="badge bg-dark border border-1 border-info text-info me-1">>=1 decent</span>
                <span className="badge bg-info text-dark me-1">>=5 good</span>
                <span className="badge bg-primary text-light me-1">>=10 great</span>
                <span className="badge bg-light text-dark me-1">>=20 amazing</span>
              </span>
              Cards
            </span>
          </th>
        </tr>
        </thead>
        <tbody>
          {filterMaps(ratedMaps, searchInput).map(m =>
            <tr key={m.name} id={m.name}>
              <td className="text-center"><b>{Math.round(m.score || 0)}</b></td>
              <td><MapName map={m} currentInput={searchInput} addToInput={addToInput}/></td>
              <td className="text-center"><RatingBadge rating={m.rating.layout}/></td>
              <td className="text-center"><RatingBadge rating={m.rating.density}/></td>
              <td className="text-center"><MapBoss boss={m.boss} rating={m.rating.boss}/></td>
              <td className="d-none d-md-table-cell"><ConnectedMaps connected={m.connected} ratedMaps={ratedMaps}/></td>
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
