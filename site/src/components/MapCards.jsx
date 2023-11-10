import { memo } from 'react'

import CardRateTooltip from './CardRateTooltip'
import MapCard from './MapCard'
import './MapCards.css'

const MapCards = ({ cards, sidebar, tooltipTop }) => {
  const total = Math.round(cards.reduce((a, b) => a + b.value, 0) * 100) / 100

  return (
    <div className={sidebar ? '' : 'd-lg-flex flex-row'}>
      <div className="m-1 map-card-price">
        <span className="tooltip-tag tooltip-tag-left">
          <span className="tooltip-tag-text">
            {cards
              .filter(c => c.value > 0)
              .map(c => (
                <CardRateTooltip key={c.name} card={c} />
              ))}
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
        {cards.map(c => (
          <MapCard key={c.name} tooltipTop={tooltipTop} card={c} />
        ))}
      </div>
    </div>
  )
}

export default memo(MapCards)
