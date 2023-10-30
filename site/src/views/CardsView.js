import GoToTop from '../components/GoToTop'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { preparedCards, preparedMonsters, wikiBase } from '../data'
import { calculateScore, filter } from '../common'
import MapName from '../components/MapName'
import useLazy from '../hooks/useLazy'
import { useMemo } from 'react'
import MapFilter from '../components/MapFilter'
import CardDetail from '../components/CardDetail'

const CardList = ({ card, voidstones }) => {
  const [ref, visible] = useLazy()

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
          <CardDetail card={card} />
        </div>
      </td>
      {visible ? (
        <td>
          <div className="row m-0">
            {card.drop.text && (
              <div className="card mb-2">
                <div className="card-body">{card.drop.text}</div>
              </div>
            )}
          </div>
          <div className="row m-0">
            {card.monsters.map(m => (
              <div className="col-2 mt-2">
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
          <div className="row m-0">
            {card.maps.map(map => (
              <div className="col-2 mt-2">
                <MapName map={map} voidstones={voidstones} cardList={true} />
              </div>
            ))}
          </div>
        </td>
      ) : (
        <td></td>
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
            maps: ratedMaps.filter(m => m.cards.find(mc => mc.name === c.name && (mc.weight > 0 || mc.unknown))),
            unknown: !c.weight,
            price: price,
            value: price >= cardMinPriceInput ? price * (c.weight || 0) : 0
          }

          out.monsters = [...new Set((out.drop.monsters || []).map(m => preparedMonsters[m] || m))].sort()
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
