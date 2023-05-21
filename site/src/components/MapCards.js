import './MapCards.css'

function calculateCardData(card, weight, weightDescription) {
  let perMap = 1
  let mapRate = card.weight / weight
  let everyMap = 1 / mapRate
  if (everyMap < 1) {
    perMap = Math.floor(1 / everyMap)
    everyMap = 1
  } else {
    everyMap = Math.ceil(everyMap)
  }
  let cardValue = Math.round(card.price * mapRate * 1000) / 1000
  let stackValue = Math.round(card.price * mapRate * card.stack * 1000) / 1000

  return {
    weight,
    weightDescription,
    perMap,
    everyMap,
    cardValue,
    stackValue
  }
}

const MapCard = ({ card, mapWeight, baselineWeight }) => {
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

  let img = '/img/alch.png'
  if (card.boss) {
    img = '/img/awsextant.png'
  } else if (card.price >= 100) {
    img = '/img/divine.png'
  } else if (card.price >= 50) {
    img = '/img/exalt.png'
  } else if (card.price >= 5) {
    img = '/img/chaos.png'
  }

  const cards = [calculateCardData(card, mapWeight, 'map weight')]

  if (mapWeight !== baselineWeight) {
    cards.push(calculateCardData(card, baselineWeight, 'baseline weight'))
  }

  badgeClass = `badge m-1 ${badgeClass}`
  return (
    <span className="tooltip-tag tooltip-tag-left tooltip-tag-compact">
      <span className="tooltip-tag-text">
        <img src={card.art} className="mb-1" alt="" loading="lazy" />
        <span className="badge bg-light text-dark map-stack-size">
          <b>{card.stack}</b>
        </span>
        <b>Reward</b>: {card.reward}
        <br />
        <b>Price</b>: {card.price} <img src="/img/chaos.png" alt="c" width="16" height="16" />
        <br />
        <b>Weight</b>: {card.weight}
        {card.boss && (
          <>
            <br />
            <b>Boss drop</b>
          </>
        )}
        {card.value > 0 &&
          cards.map(mapCard => (
            <>
              <hr />
              <b>{card.weight}</b> (weight) / <b>{mapCard.weight}</b> ({mapCard.weightDescription})
              <br />= <b>{mapCard.perMap}</b> every <b>{mapCard.everyMap > 1 && mapCard.everyMap}</b>{' '}
              {mapCard.everyMap > 1 ? 'maps' : 'map'}
              <br />= <b>{mapCard.cardValue}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per map
              <br />* <b>{card.stack}</b> (stack size)
              <br />= <b>{mapCard.stackValue}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per stack
            </>
          ))}
      </span>
      <a className={badgeClass} href={card.ninja} target="_blank" rel="noreferrer">
        <img src={img} alt="" width="16" height="16" /> {card.name}
      </a>
    </span>
  )
}

const MapCards = ({ cards, hideLowValueCards, cardWeightBaseline }) => {
  const weights = cards.map(c => c.weight)
  const mapWeight = weights.reduce((a, b) => a + b, 0)
  const baselineWeight = Math.ceil(mapWeight / cards.length + cardWeightBaseline)

  return (
    <>
      {cards
        .sort((a, b) => b.price - a.price)
        .sort((a, b) => b.score - a.score)
        .filter(c => !hideLowValueCards || c.value > 0)
        .map(c => (
          <MapCard card={c} mapWeight={mapWeight} baselineWeight={baselineWeight} />
        ))}
    </>
  )
}

export default MapCards
