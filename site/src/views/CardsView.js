import GoToTop from '../components/GoToTop'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { preparedCards } from '../data'
import { calculateScore } from '../common'
import MapName from '../components/MapName'
import useLazy from '../hooks/useLazy'
import Rating from '../components/Rating'
import { useMemo } from 'react'

const CardList = ({ card, voidstones }) => {
  const [ref, visible] = useLazy()

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
    <tr ref={ref}>
      <td
        style={{
          width: '245px'
        }}
        className="p-0"
      >
        <div
          style={{
            backgroundColor: 'black'
          }}
          className="p-1"
        >
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
          <b>Score</b>: <Rating rating={card.score} />
          <br />
          <b>Price</b>: {card.price} <img src="/img/chaos.png" alt="c" width="16" />
          <br />
          <b>Weight</b>: {card.weight}
          {card.drop && (card.drop.min_level || card.drop.max_level) && (
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
        </div>
      </td>
      <td>{visible && card.maps.map(map => <MapName map={map} voidstones={voidstones} />)}</td>
    </tr>
  )
}

const CardsView = ({ view, setView, ratedMaps, cardMinPriceInput, voidstones }) => {
  const cards = useMemo(
    () =>
      calculateScore(
        preparedCards.map(c => {
          return {
            ...c,
            drop: c.drop || {},
            boss: ((c.drop || {}).monsters || []).length > 0,
            maps: ratedMaps.filter(m => m.cards.find(mc => mc.name === c.name)),
            unknown: !c.weight,
            value: c.price >= cardMinPriceInput ? (c.price || 0) * (c.weight || 0) : 0
          }
        }),
        10
      ).sort((a, b) => b.score - a.score),
    [preparedCards, ratedMaps, cardMinPriceInput]
  )

  return (
    <>
      <GoToTop />
      <Navbar view={view} setView={setView} />
      <table className="table table-responsive table-striped mb-0">
        <thead>
          <tr>
            <th scope="col">Card</th>
            <th scope="col">Maps</th>
          </tr>
        </thead>
        <tbody>
          {cards.map(c => (
            <CardList card={c} voidstones={voidstones} />
          ))}
        </tbody>
      </table>
      <Footer />
    </>
  )
}

export default CardsView
