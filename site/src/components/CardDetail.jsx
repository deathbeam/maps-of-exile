import { cardBadge, priceImage } from '../common'
import { wikiBase } from '../constants'
import Rating from './Rating'

const CardDetail = ({ card }) => {
  const badgeClass = cardBadge(card, 10)
  const img = priceImage(card.price)

  let dropLevel = null
  if (card.drop) {
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
  }

  return (
    <>
      <a href={wikiBase + card.name} target="_blank" rel="noreferrer" className={badgeClass + ' w-100 map-reward mb-1'}>
        <img src={img} alt="" width="16" height="16" className="me-1" />
        {card.boss && <img src="/img/boss.webp" alt="" width="16" className="me-1" />}
        {card.name}
      </a>
      <div className="map-img-holder">
        <img src={card.art} alt="" loading="lazy" className="w-100" />
        <span className="badge bg-light text-dark map-stack-size">
          <b>{card.stack}</b>
        </span>
      </div>
      <span className="badge bg-dark text-light w-100 map-reward">{card.reward}</span>
      <div className="m-1">
        <b>Score</b>: <Rating rating={card.score} scale={10} />
        <br />
        <b>Price</b>: {Math.round(card.price * 100) / 100} <img src="/img/chaos.png" alt="c" width="16" />
        {!card.unknown && (
          <>
            <br />
            <b>Weight</b>: {card.weight}
          </>
        )}
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
      </div>
    </>
  )
}

export default CardDetail
