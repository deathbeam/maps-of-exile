import CardRateTooltip from './CardRateTooltip'
import MapCard from './MapCard'
import './MapCards.css'
import Rating from './Rating'

const MapCards = ({ cards, rating, sidebar = false, tooltipTop = false }) => {
  return (
    <div className={sidebar ? '' : 'd-lg-flex flex-row'}>
      <div className="map-card-price">
        <span className="tooltip-tag tooltip-tag-left w-100">
          <span className="tooltip-tag-text">
            {cards
              .filter(c => c.value > 0)
              .map(c => (
                <CardRateTooltip key={c.name} card={c} />
              ))}
          </span>
          <Rating rating={rating} label={sidebar ? 'Card' : ''} sidebar={sidebar} />
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

export default MapCards
