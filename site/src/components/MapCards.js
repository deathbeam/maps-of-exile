import './MapCards.css'
import { useMemo } from 'react'

function calculateCardData(card) {
  const mapRate = (card.weight / card.poolWeight) * card.dropPoolItems
  let perMap = 1
  let everyMap = 1 / mapRate
  if (everyMap < 1) {
    perMap = Math.floor(1 / everyMap)
    everyMap = 1
  } else {
    everyMap = Math.ceil(everyMap)
  }

  return {
    ...card,
    value: Math.round(card.value * 1000) / 1000,
    perMap,
    everyMap
  }
}

function CardDataTooltip({ card, withName = false }) {
  return withName ? (
    <>
      <b>{card.perMap}</b> {withName && <b>{card.name}</b>} every <b>{card.everyMap > 1 && card.everyMap}</b>{' '}
      {card.everyMap > 1 ? 'maps' : 'map'}
      <br />= <b>{card.value}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per map
      <br />
    </>
  ) : (
    <>
      <br />= <b>{card.perMap}</b> every <b>{card.everyMap > 1 && card.everyMap}</b>{' '}
      {card.everyMap > 1 ? 'maps' : 'map'}
      <br />= <b>{card.value}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per map
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
  if (card.price >= 100) {
    img = '/img/divine.png'
  } else if (card.price >= 50) {
    img = '/img/exalt.png'
  } else if (card.price >= 5) {
    img = '/img/chaos.png'
  }

  const tooltip = (
    <>
      <hr />
      <b>{card.weight}</b> (card weight)
      <br />/ <b>{card.poolWeight}</b> (drop pool weight)
      {card.dropPoolItems > 1 && (
        <>
          <br />* <b>{Math.round(card.dropPoolItems)}</b> (drop pool items)
        </>
      )}
      <CardDataTooltip card={card} />
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
        <b>Price</b>: {card.price} <img src="/img/chaos.png" alt="c" width="16" />
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
        <img src={img} alt="" width="16" height="16" className="outline me-1" />
        {card.boss && <img src="/img/boss.webp" alt="" width="16" className="outline me-1" />}
        {card.name}
      </a>
    </span>
  )
}

const MapCards = ({ cards, hideLowValueCards }) => {
  const total = useMemo(() => Math.round(cards.reduce((a, b) => a + b.value, 0) * 100) / 100, [cards])
  const cardsWithData = useMemo(
    () => cards.filter(c => !hideLowValueCards || c.value > 0).map(c => calculateCardData(c)),
    [cards, hideLowValueCards]
  )

  return (
    <div className="d-md-flex flex-row">
      <div className="m-1">
        <span className="tooltip-tag tooltip-tag-left tooltip-tag-compact text-nowrap">
          <span className="tooltip-tag-text">
            {cardsWithData
              .filter(c => c.value > 0)
              .map(c => (
                <CardDataTooltip card={c} withName={true} />
              ))}
          </span>
          <small>{total}</small> <img src="/img/chaos.png" alt="" width="16" className="outline me-1" />
        </span>
      </div>
      <div>
        {cardsWithData.map(c => (
          <MapCard card={c} />
        ))}
      </div>
    </div>
  )
}

export default MapCards
