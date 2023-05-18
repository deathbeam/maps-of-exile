import alch from '../img/alch.png'
import divine from '../img/divine.png'
import exalt from '../img/exalt.png'
import chaos from '../img/chaos.png'

function calculateCardData(card, weight, weightDescription) {
  let perMap = 1
  let mapRate = card.weight / weight
  let everyMap = 1 / mapRate
  if (everyMap < 1) {
    perMap = Math.floor(1 / everyMap)
    everyMap = 1
  } else {
    everyMap = Math.ceil(everyMap)
  }
  let cardValue = Math.round(card.price * mapRate * 1000) / 1000
  let stackValue = Math.round(card.price * mapRate * card.stack * 1000) / 1000

  return {
    weight,
    weightDescription,
    perMap,
    everyMap,
    cardValue,
    stackValue
  }
}

const MapCard = ({ card, mapWeight, baselineWeight }) => {
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

  const cards = [
    calculateCardData(card, mapWeight, 'map weight'),
    calculateCardData(card, baselineWeight, 'baseline weight')
  ]

  badgeClass = `badge m-1 ${badgeClass}`
  return (
    <span className="tooltip-tag tooltip-tag-left tooltip-tag-compact">
      <span className="tooltip-tag-text">
        <b>Reward</b>: {card.reward}
        <br />
        <b>Stack size</b>: {card.stack}
        <br />
        <b>Price</b>: {card.price} <img src={chaos} alt="c" width="16" height="16" />
        <br />
        <b>Weight</b>: {card.weight}
        {card.value > 0 &&
          cards.map(mapCard => (
            <>
              <hr />
              <b>{card.weight}</b> (weight) / <b>{mapCard.weight}</b> ({mapCard.weightDescription})
              <br />= <b>{mapCard.perMap}</b> every <b>{mapCard.everyMap > 1 && mapCard.everyMap}</b>{' '}
              {mapCard.everyMap > 1 ? 'maps' : 'map'}
              <br />= <b>{mapCard.cardValue}</b> <img src={chaos} alt="c" width="16" height="16" /> per map
              <br />* <b>{card.stack}</b> (stack size)
              <br />= <b>{mapCard.stackValue}</b> <img src={chaos} alt="c" width="16" height="16" /> per stack
            </>
          ))}
      </span>
      <a className={badgeClass} href={card.ninja} target="_blank" rel="noreferrer">
        <img src={img} alt="" width="16" height="16" /> {card.name}
      </a>
    </span>
  )
}

const MapCards = ({ cards, hideLowValueCards, cardWeightBaseline }) => {
  const mapWeight = cards.reduce((a, b) => a + b.weight, 0)
  const baselineWeight =
    cards.reduce((a, b) => a + (b.weight >= cardWeightBaseline ? 0 : b.weight), 0) + cardWeightBaseline

  return (
    <>
      {cards
        .sort((a, b) => b.price - a.price)
        .sort((a, b) => b.score - a.score)
        .filter(c => !hideLowValueCards || c.value > 0)
        .map(c => (
          <MapCard card={c} mapWeight={mapWeight} baselineWeight={baselineWeight} />
        ))}
    </>
  )
}

export default MapCards
