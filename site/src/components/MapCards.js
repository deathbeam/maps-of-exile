import './MapCards.css'
import { useMemo } from 'react'
import CardDetail from './CardDetail'
import { cardBadge, priceImage } from '../common'

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

const MapCard = ({ tooltipTop, type, card }) => {
  const badgeClass = cardBadge(card)
  const img = priceImage(card.price)
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
      {type === 'map' && (
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

  return (
    <span
      className={
        'tooltip-tag tooltip-tag-compact ' + (tooltipTop ? 'tooltip-tag-top' : 'tooltip-tag-left tooltip-tag-left-mid')
      }
    >
      <span className="tooltip-tag-text">
        <CardDetail card={card} />
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

const MapCards = ({ sidebar, tooltipTop, cardValueSourceInput, type, cards }) => {
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
                  type === 'map' && <CardRateTooltip rate={c.kirac} description={'kirac mission'} name={c.name} />
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
          <MapCard tooltipTop={tooltipTop} type={type} card={c} />
        ))}
      </div>
    </div>
  )
}

export default MapCards
