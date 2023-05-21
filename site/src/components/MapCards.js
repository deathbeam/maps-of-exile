import './MapCards.css'

function calculateCardData(card, mapRate) {
  const stackSize = card.stack
  let perMap = 1
  let everyMap = 1 / mapRate
  if (everyMap < 1) {
    perMap = Math.floor(1 / everyMap)
    everyMap = 1
  } else {
    everyMap = Math.ceil(everyMap)
  }
  let cardValue = Math.round(card.price * mapRate * 1000) / 1000
  let stackValue = Math.round(card.price * mapRate * stackSize * 1000) / 1000

  return {
    perMap,
    everyMap,
    stackSize,
    cardValue,
    stackValue
  }
}

function cardDataToTooltip(cardData, withStack = false) {
  return (
    <>
      <br />= <b>{cardData.perMap}</b> every <b>{cardData.everyMap > 1 && cardData.everyMap}</b>{' '}
      {cardData.everyMap > 1 ? 'maps' : 'map'}
      <br />= <b>{cardData.cardValue}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per map
      {withStack && (
        <>
          <br />* <b>{cardData.stackSize}</b> (stack size)
          <br />= <b>{cardData.stackValue}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per stack
        </>
      )}
    </>
  )
}

const MapCard = ({ card }) => {
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
  badgeClass = `badge m-1 ${badgeClass}`

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

  const mapCardWeight = card.poolWeight
  const dropPoolItems = card.dropPoolItems
  const mapCardRate = (card.weight / mapCardWeight) * dropPoolItems
  const mapCard = calculateCardData(card, mapCardRate)
  const tooltip = (
    <>
      <hr />
      <b>{card.weight}</b> (card weight)
      <br />/ <b>{mapCardWeight}</b> (drop pool weight)
      {dropPoolItems > 1 && (
        <>
          <br />* <b>{Math.round(dropPoolItems)}</b> (drop pool items)
        </>
      )}
      {cardDataToTooltip(mapCard)}
    </>
  )

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
        {card.value > 0 && tooltip}
      </span>
      <a className={badgeClass} href={card.ninja} target="_blank" rel="noreferrer">
        <img src={img} alt="" width="16" height="16" /> {card.name}
      </a>
    </span>
  )
}

const MapCards = ({ cards, hideLowValueCards }) => {
  const total = Math.round(cards.reduce((a, b) => a + b.value, 0) * 10) / 10
  return (
    <div className="d-md-flex flex-row">
      <div className="text-center pe-2 pb-2">
        <div className="d-flex align-items-center">
          {total} <img src="/img/chaos.png" className="m-1" alt="" width="16" height="16" />
        </div>
      </div>
      <div>
        {cards
          .filter(c => !hideLowValueCards || c.value > 0)
          .map(c => (
            <MapCard card={c} />
          ))}
      </div>
    </div>
  )
}

export default MapCards
