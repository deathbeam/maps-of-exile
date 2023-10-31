import { cardBadge, priceImage } from '../common'
import CardRateTooltip from './CardRateTooltip'
import CardDetail from './CardDetail'
import { memo } from 'react'

const MapCard = ({ card, type, tooltipTop }) => {
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
    <span className={'tooltip-tag ' + (tooltipTop ? 'tooltip-tag-top' : 'tooltip-tag-left tooltip-tag-left-mid')}>
      <span className="tooltip-tag-text map-card">
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

export default memo(MapCard)
