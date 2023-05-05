import 'bootstrap/dist/css/bootstrap.css'
import './App.css'
import cards from './data/cards.json'
import maps from './data/maps.json'
import Tooltip from './Tooltip'
import {useState} from 'react'

function tierColor(map) {
  const naturalTier = map["tiers"][0]

  if (naturalTier >= 11) {
    return "text-danger"
  } else if (naturalTier >= 6) {
    return "text-warning"
  } else {
    return "text-light"
  }
}

function ratingBadge(rating) {
  let badgeClass = "bg-danger"

  if (rating >= 7) {
    badgeClass = "bg-success"
  } else if (rating >= 5) {
    badgeClass = "bg-info"
  } else if (rating >= 3) {
    badgeClass = "bg-warning"
  }

  badgeClass = `badge badge-pill text-dark ${badgeClass}`
  return <span className={badgeClass}>{rating}</span>
}

function bossDisplay(map) {
  return <Tooltip text={map["boss"]["notes"] || ""}>
    <div>
      {ratingBadge(map["boss"]["rating"])} {map["boss"]["name"]}
    </div>
  </Tooltip>
}

function cardDisplay(card) {
  let badgeClass = "bg-secondary"
  const score = card["score"]

  if (score >= 50) {
    badgeClass = "bg-danger"
  } else if (score >= 20) {
    badgeClass = "bg-warning"
  } else if (score >= 10) {
    badgeClass = "bg-info"
  } else if (score >= 2) {
    badgeClass = "bg-primary"
  }

  badgeClass = `badge badge-pill text-dark ${badgeClass}`

  return <span>
    <a className={badgeClass} href={card["ninja"]} target="_blank">{card["name"]}</a>{' '}
</span>
}

function getCardValue(card) {
  if (!card) {
    return 0
  }

  return (parseFloat(card["price"]) * parseFloat(card["rate"]))
}

function calculateScore(dataset) {
  const nonzerodataset = dataset.filter(m => m["value"] > 0)
  const min = Math.min(...nonzerodataset.map(o => o["value"]))
  const max = Math.max(...nonzerodataset.map(o => o["value"])) - min

  for (let entry of dataset) {
    entry["score"] = 100 * (entry["value"] - min) / max
  }

  return dataset
}

function mapAndRateCards(foundCards) {
  let out = []

  for (let card of cards) {
    out.push({
      ...card,
      value: getCardValue(card)
    })
  }

  return calculateScore(out)
    .filter(c => foundCards.includes(c["name"]))
    .sort((a, b) => b["score"] - a["score"])
}

function filterAndRateMaps(foundMaps, searchInput, layoutInput, densityInput, bossInput, cardInput) {
  foundMaps = foundMaps.filter(m => !!m["layout"])
  let out = []

  for (let map of foundMaps) {
    const layoutValue = map["layout"] * layoutInput
    const densityValue = map["density"] * densityInput
    const bossValue = map["boss"]["rating"] * bossInput
    let cardValue = 0

    for (let card of map["cards"]) {
      const cardData = cards.find(c => c["name"] === card)
      cardValue += getCardValue(cardData)
    }

    cardValue = cardValue * cardInput
    out.push({
      ...map,
      value: layoutValue + densityValue + bossValue + cardValue
    })
  }

  return calculateScore(out)
    .filter(m => !searchInput
      || m["name"].toLowerCase().includes(searchInput.toLowerCase())
      || m["cards"].find(c => c.toLowerCase().includes(searchInput.toLowerCase()))
    )
    .sort((a, b) => b["score"] - a["score"])
}

function App() {
  const [searchInput, setSearchInput] = useState('')
  const [layoutInput, setLayoutInput] = useState('3')
  const [densityInput, setDensityInput] = useState('2')
  const [bossInput, setBossInput] = useState('0.5')
  const [cardInput, setCardInput] = useState('0.5')

  return (
    <div className="bg-dark">
      <div className="container-fluid p-4">
        <div className="row">
          <div className="col">
            <label className="form-label text-light">Search</label>
            <input className="form-control bg-dark text-light" type="search" placeholder="Search for map or card" value={searchInput} onChange={e => setSearchInput(e.target.value)}/>
          </div>
          <div className="col">
            <label className="form-label text-light">Layout weight</label>
            <input className="form-control bg-dark text-light" type="number" value={layoutInput} onChange={e => setLayoutInput(e.target.value)}/>
          </div>
          <div className="col">
            <label className="form-label text-light">Density weight</label>
            <input className="form-control bg-dark text-light" type="number" value={densityInput} onChange={e => setDensityInput(e.target.value)}/>
          </div>
          <div className="col">
            <label className="form-label text-light">Boss weight</label>
            <input className="form-control bg-dark text-light" type="number" value={bossInput} onChange={e => setBossInput(e.target.value)}/>
          </div>
          <div className="col">
            <label className="form-label text-light">Card weight</label>
            <input className="form-control bg-dark text-light" type="number" value={cardInput} onChange={e => setCardInput(e.target.value)}/>
          </div>
        </div>
      </div>
      <table className="table table-dark mb-0">
        <thead>
        <tr>
          <th scope="col">Score</th>
          <th scope="col">Map</th>
          <th scope="col">Layout</th>
          <th scope="col">Density</th>
          <th scope="col">Boss</th>
          <th scope="col">Cards</th>
        </tr>
        </thead>
        <tbody>
        {filterAndRateMaps(maps, searchInput, layoutInput, densityInput, bossInput, cardInput).map(m =>
          <tr>
            <td><b>{Math.round(m["score"])}</b></td>
            <td><a href={m["wiki"]} target="_blank" className={tierColor(m)}>{m["name"]}</a></td>
            <td>{ratingBadge(m["layout"])}</td>
            <td>{ratingBadge(m["density"])}</td>
            <td>{bossDisplay(m)}</td>
            <td>{mapAndRateCards(m["cards"]).map(c => cardDisplay(c))}</td>
          </tr>
        )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
