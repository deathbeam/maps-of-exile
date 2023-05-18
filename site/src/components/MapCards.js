import alch from '../img/alch.png'
import divine from '../img/divine.png'
import exalt from '../img/exalt.png'
import chaos from '../img/chaos.png'
import { cardBossMulti } from '../data'

const MapCard = ({ card, cardWeightBaseline }) => {
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

  let img = alch

  if (card.price >= 100) {
    img = divine
  } else if (card.price >= 50) {
    img = exalt
  } else if (card.price >= 5) {
    img = chaos
  }

  let perMap = 1
  let everyMap = 1 / (card.weight / cardWeightBaseline)

  if (everyMap < 1) {
    perMap = Math.floor(1 / everyMap)
    everyMap = 1
  } else {
    everyMap = Math.ceil(everyMap)
  }

  let perMapSuf = everyMap > 1 ? 'maps' : 'map'

  badgeClass = `badge m-1 ${badgeClass}`
  return (
    <span className="tooltip-tag tooltip-tag-left tooltip-tag-compact">
      <span className="tooltip-tag-text">
        <b>Reward</b>: {card.reward}
        <br />
        <b>Stack size</b>: {card.stack}
        <br />
        <b>Price</b>: {card.price} <img src={chaos} alt="c" width="16" height="16" />
        {card.value > 0 ? (
          <>
            <br />
            <b>* Weight</b>: {card.weight}
            <br />
            <b>/ Baseline</b>: {cardWeightBaseline}
            {card.boss && (
              <>
                <br />
                <b>/ Boss drop</b>: {cardBossMulti}
              </>
            )}
            <br />
            <b>= Value</b>: {Math.round(card.value * 1000) / 1000} <img src={chaos} alt="c" width="16" height="16" />
            <br />
            <b>= {perMap}</b> every <b>{everyMap > 1 && everyMap}</b> {perMapSuf}
          </>
        ) : (
          <>
            <br />
            <b>Weight</b>: {card.weight}
          </>
        )}
      </span>
      <a className={badgeClass} href={card.ninja} target="_blank" rel="noreferrer">
        <img src={img} alt="" width="16" height="16" /> {card.name}
      </a>
    </span>
  )
}

const MapCards = ({ cards, cardWeightBaseline, hideLowValueCards }) => {
  const avg = Math.round(cards.reduce((a, b) => a + b.value, 0) * 100) / 100

  return (
    <div className="row g-0">
      <div className="col-md-1 d-md-flex justify-content-end">
        <span className="p-2 d-md-flex">
          {avg}
          <img src={chaos} alt="c" width="16" height="16" className="m-1" />
        </span>
      </div>
      <div className="col-md-11">
        {cards
          .sort((a, b) => b.price - a.price)
          .sort((a, b) => b.score - a.score)
          .filter(c => !hideLowValueCards || c.value > 0)
          .map(c => (
            <MapCard card={c} cardWeightBaseline={cardWeightBaseline} />
          ))}
      </div>
    </div>
  )
}

export default MapCards