import './MapCards.css'
import { useMemo } from 'react'
import CardRateTooltip from './CardRateTooltip'
import MapCard from './MapCard'

function calcRate(mapRate, price, stack) {
  let perMap = 1
  let everyMap = 1 / mapRate
  if (everyMap < 1) {
    perMap = Math.floor(Math.round((1 / everyMap) * 100) / 100)
    everyMap = 1
  } else {
    everyMap = Math.ceil(Math.round(everyMap * 100) / 100)
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

const MapCards = ({ cards, type, cardValueSourceInput, sidebar, tooltipTop }) => {
  const total = useMemo(() => Math.round(cards.reduce((a, b) => a + b.value, 0) * 100) / 100, [cards])
  const cardsWithData = useMemo(() => cards.filter(c => !c.hidden).map(c => calculateCardData(c)), [cards])

  return (
    <div className={sidebar ? '' : 'd-lg-flex flex-row'}>
      <div className="m-1 map-card-price">
        <span className="tooltip-tag tooltip-tag-left">
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
