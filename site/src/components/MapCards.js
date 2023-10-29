import './MapCards.css'
import { useMemo } from 'react'

function calcRate(mapRate, price, stack) {
  let perMap = 1
  let everyMap = 1 / mapRate
  if (everyMap < 1) {
    perMap = Math.floor(1 / everyMap)
    everyMap = 1
  } else {
    everyMap = Math.ceil(everyMap)
  }

  return {
    perMap: perMap * stack,
    everyMap,
    value: Math.round(price * mapRate * stack * 1000) / 1000
  }
}

function calculateCardData(card) {
  const mapRate = (card.weight / card.mapWeight) * card.dropPoolItems
  const kiracRate = card.weight / card.kiracWeight

  const calcMap = calcRate(mapRate, card.price, 1)
  const calcKirac = calcRate(kiracRate, card.price, card.stack)

  return {
    ...card,
    map: calcMap,
    kirac: calcKirac
  }
}

function CardRateTooltip({ rate, description, name }) {
  const perDescription = rate.everyMap > 1 ? description + 's' : description
  return !!name ? (
    <>
      <b>{rate.perMap}</b> <b>{name}</b> every <b>{rate.everyMap > 1 && rate.everyMap}</b> {perDescription}
      <br />= <b>{rate.value}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per {description}
      <br />
    </>
  ) : (
    <>
      = <b>{rate.perMap}</b> every <b>{rate.everyMap > 1 && rate.everyMap}</b> {perDescription}
      <br />= <b>{rate.value}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per {description}
      <br />
    </>
  )
}

const MapCard = ({ unique, card }) => {
  let badgeClass
  if (card.score >= 8) {
    badgeClass = 'bg-light text-dark'
  } else if (card.score >= 5) {
    badgeClass = 'bg-primary text-light'
  } else if (card.score >= 2) {
    badgeClass = 'bg-info text-dark'
  } else if (card.score >= 0.5) {
    badgeClass = 'bg-dark text-info border border-1 border-info'
  } else {
    badgeClass = 'bg-secondary text-dark'
  }

  if (card.unknown) {
    badgeClass += ' border border-1 border-dark shadow-info'
  } else if (card.weight === 0) {
    badgeClass += ' border border-1 border-dark shadow-danger'
  } else if (card.boss) {
    badgeClass += ' border border-1 border-dark shadow-warning'
  }

  badgeClass = `badge m-1 ${badgeClass}`

  let img = '/img/alch.png'
  if (card.price >= 100) {
    img = '/img/divine.png'
  } else if (card.price >= 20) {
    img = '/img/exalt.png'
  } else if (card.price >= 5) {
    img = '/img/chaos.png'
  }

  const tooltip = card.weight > 0 && (
    <>
      <hr />
      <b>{card.weight}</b> (card weight)
      <br />/ <b>{card.mapWeight}</b> (drop pool weight)
      {card.dropPoolItems > 1 && (
        <>
          <br />* <b>{Math.round(card.dropPoolItems)}</b> (drop pool items)
        </>
      )}
      <br />
      <CardRateTooltip rate={card.map} description={'map'} />
      {!unique && (
        <>
          <hr />
          <b>{card.weight}</b> (card weight)
          <br />/ <b>{card.kiracWeight}</b> (map pool weight)
          <br />
          <CardRateTooltip rate={card.kirac} description={'kirac mission'} />
        </>
      )}
    </>
  )

  let dropLevel = null
  if (card.drop.min_level && card.drop.max_level) {
    dropLevel = (
      <>
        {card.drop.min_level} - {card.drop.max_level}
      </>
    )
  } else if (card.drop.min_level) {
    dropLevel = <>&gt;= {card.drop.min_level}</>
  } else if (card.drop.max_level) {
    dropLevel = <>&lt;= {card.drop.max_level}</>
  }

  return (
    <span className="tooltip-tag tooltip-tag-compact tooltip-tag-left tooltip-tag-left-mid">
      <span className="tooltip-tag-text">
        <span className={badgeClass + ' w-100 map-reward mb-1'}>
          <img src={img} alt="" width="16" height="16" className="me-1" />
          {card.boss && <img src="/img/boss.webp" alt="" width="16" className="me-1" />}
          {card.name}
        </span>
        <div className="map-img-holder mb-1">
          <img src={card.art} alt="" loading="lazy" />
          <span className="badge bg-light text-dark map-stack-size">
            <b>{card.stack}</b>
          </span>
        </div>
        <span className="badge bg-dark text-light w-100 map-reward mb-1">{card.reward}</span>
        <b>Price</b>: {card.price} <img src="/img/chaos.png" alt="c" width="16" />
        <br />
        <b>Weight</b>: {card.weight}
        {(card.drop.min_level || card.drop.max_level) && (
          <>
            <br />
            <b>Drop level</b>: {dropLevel}
          </>
        )}
        {card.boss && (
          <>
            <br />
            <b className="text-warning">Boss drop</b>
          </>
        )}
        {card.unknown && (
          <>
            <br />
            <b className="text-info">Unknown weight</b>
          </>
        )}
        {card.weight === 0 && !card.unknown && (
          <>
            <br />
            <b className="text-danger">Cannot drop</b>
          </>
        )}
        {tooltip}
      </span>
      <a className={badgeClass} href={card.ninja} target="_blank" rel="noreferrer">
        <img src={img} alt="" width="16" height="16" className="me-1" />
        {card.boss && <img src="/img/boss.webp" alt="" width="16" className="me-1" />}
        {card.name}
      </a>
    </span>
  )
}

const MapCards = ({ sidebar, cardValueSourceInput, unique, cards }) => {
  const total = useMemo(() => Math.round(cards.reduce((a, b) => a + b.value, 0) * 100) / 100, [cards])
  const cardsWithData = useMemo(() => cards.filter(c => !c.hidden).map(c => calculateCardData(c)), [cards])

  return (
    <div className={sidebar ? '' : 'd-lg-flex flex-row'}>
      <div className="m-1 map-card-price">
        <span className="tooltip-tag tooltip-tag-left tooltip-tag-compact text-nowrap w-100">
          <span className="tooltip-tag-text">
            {cardsWithData
              .filter(c => c.value > 0)
              .map(c =>
                cardValueSourceInput === 'kirac' ? (
                  !unique && <CardRateTooltip rate={c.kirac} description={'kirac mission'} name={c.name} />
                ) : (
                  <CardRateTooltip rate={c.map} description={'map'} name={c.name} />
                )
              )}
          </span>
          {sidebar ? (
            <>
              <b>{total}</b> <img src="/img/chaos.png" alt="" width="16" className="me-1" /> per map
              <hr />
            </>
          ) : (
            <>
              <small>{total}</small> <img src="/img/chaos.png" alt="" width="16" className="me-1" />
            </>
          )}
        </span>
      </div>
      <div>
        {cardsWithData.map(c => (
          <MapCard unique={unique} card={c} />
        ))}
      </div>
    </div>
  )
}

export default MapCards
