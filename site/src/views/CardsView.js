import GoToTop from '../components/GoToTop'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { preparedCards, preparedMonsters, wikiBase } from '../data'
import { calculateScore, filter } from '../common'
import MapName from '../components/MapName'
import useLazy from '../hooks/useLazy'
import Rating from '../components/Rating'
import { useMemo } from 'react'
import MapFilter from '../components/MapFilter'

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
          <a
            href={wikiBase + card.name}
            target="_blank"
            rel="noreferrer"
            className={badgeClass + ' w-100 map-reward mb-1'}
          >
            <img src={img} alt="" width="16" height="16" className="me-1" />
            {card.boss && <img src="/img/boss.webp" alt="" width="16" className="me-1" />}
            {card.name}
          </a>
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
          {!card.unknown && (
            <>
              <br />
              <b>Weight</b>: {card.weight}
            </>
          )}
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
      {visible ? (
        <>
          <td>
            {card.boss && (
              <div className="row m-0 mb-2">
                {card.monsters.map(m => (
                  <div className="col-2">
                    <div className="d-lg-flex flex-row">
                      <div className="pe-2 pb-2">
                        <div className="map-icon-container">
                          <img src="/img/boss.webp" alt="" />
                        </div>
                      </div>
                      <div>
                        <a className="text-light" href={wikiBase + m} target="_blank" rel="noreferrer">
                          {m}
                        </a>
                        <br />
                        <span className="badge bg-warning text-dark">monster</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="row m-0">
              {card.maps.map(map => (
                <div className="col-2">
                  <MapName map={map} voidstones={voidstones} cardList={true} />
                </div>
              ))}
            </div>
          </td>
        </>
      ) : (
        <>
          <td></td>
        </>
      )}
    </tr>
  )
}

function filterCards(ratedCards, currentSearch) {
  return ratedCards
    .filter(m => !currentSearch || filter(currentSearch, m.search))
    .sort(
      (a, b) =>
        Number(filter(currentSearch, b.name.toLowerCase())) - Number(filter(currentSearch, a.name.toLowerCase()))
    )
}

const CardsView = ({
  view,
  setView,
  ratedMaps,
  cardMinPriceInput,
  cardPriceSourceInput,
  voidstones,
  inputs,
  addToInput,
  currentSearch,
  searchInput,
  searchRef,
  setSearchInput
}) => {
  const ratedCards = useMemo(
    () =>
      calculateScore(
        preparedCards.map(c => {
          const price = (cardPriceSourceInput === 'standard' ? c.standardPrice : c.price) || 0
          const out = {
            ...c,
            drop: c.drop || {},
            maps: ratedMaps.filter(m => m.cards.find(mc => (mc.name === c.name && mc.weight > 0) || mc.unknown)),
            unknown: !c.weight,
            price: price,
            value: price >= cardMinPriceInput ? price * (c.weight || 0) : 0
          }

          out.monsters = [...new Set((out.drop.monsters || []).map(m => preparedMonsters.get(m) || m))].sort()
          out.boss = out.monsters.length > 0
          out.search = [
            ...new Set([
              out.name,
              out.reward,
              ...out.monsters,
              ...out.maps.map(c => c.name),
              ...out.maps.flatMap(c => c.tags).map(t => t.name)
            ])
          ].map(v => v.trim().toLowerCase())

          return out
        }),
        10
      ).sort((a, b) => b.score - a.score),
    [ratedMaps, cardMinPriceInput, cardPriceSourceInput]
  )

  const filteredCards = useMemo(() => filterCards(ratedCards, currentSearch), [ratedCards, currentSearch])

  return (
    <>
      <GoToTop />
      <Navbar view={view} setView={setView} />
      <div className="container-fluid p-2 row g-0">
        <MapFilter
          inputs={inputs}
          sidebar={false}
          addToInput={addToInput}
          currentSearch={currentSearch}
          searchInput={searchInput}
          searchRef={searchRef}
          setSearchInput={setSearchInput}
        />
      </div>
      <table className="table table-responsive table-striped mb-0">
        <thead>
          <tr>
            <th scope="col">Card</th>
            <th scope="col">Sources</th>
          </tr>
        </thead>
        <tbody>
          {filteredCards.map(c => (
            <CardList card={c} voidstones={voidstones} />
          ))}
        </tbody>
      </table>
      <Footer />
    </>
  )
}

export default CardsView
