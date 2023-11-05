import GoToTop from '../components/GoToTop'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { preparedCards, preparedMonsters } from '../data'
import { calculateScore, filter } from '../common'
import { useMemo } from 'react'
import MapFilter from '../components/MapFilter'
import Card from '../components/cards/Card'

function filterCards(ratedCards, currentSearch) {
  return ratedCards
    .filter(m => !currentSearch || filter(currentSearch, m.search))
    .sort(
      (a, b) =>
        Number(filter(currentSearch, b.name.toLowerCase())) - Number(filter(currentSearch, a.name.toLowerCase()))
    )
}

const CardsRoute = ({
  ratedMaps,
  cardDisplayInput,
  cardMinPriceInput,
  cardPriceSourceInput,
  voidstonesInput,
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
            maps: ratedMaps.filter(m =>
              m.cards.find(mc => {
                if (mc.name !== c.name) {
                  return false
                }
                return mc.unknown || cardDisplayInput === 'all' || cardDisplayInput === 'high' || mc.weight > 0
              })
            ),
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
        100
      )
        .filter(card => card.price >= cardMinPriceInput || cardDisplayInput === 'all' || cardDisplayInput === 'drop')
        .sort((a, b) => b.score - a.score),
    [ratedMaps, cardDisplayInput, cardMinPriceInput, cardPriceSourceInput]
  )

  const filteredCards = useMemo(() => filterCards(ratedCards, currentSearch), [ratedCards, currentSearch])

  return (
    <>
      <GoToTop />
      <Navbar />
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
      <table className="table table-responsive mb-0">
        <thead>
          <tr>
            <th>Card</th>
            <th>Sources</th>
          </tr>
        </thead>
        <tbody>
          {filteredCards.map(c => (
            <Card key={c.name} card={c} voidstones={voidstonesInput} />
          ))}
        </tbody>
      </table>
      <Footer />
    </>
  )
}

export default CardsRoute
