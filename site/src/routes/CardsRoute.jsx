import GoToTop from '../components/GoToTop'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import MapFilter from '../components/MapFilter'
import Card from '../components/cards/Card'
import { AppState } from '../state.js'
import { useContext } from 'react'

const CardsRoute = () => {
  const state = useContext(AppState)
  const filteredCards = state.filteredCards
  const voidstones = state.input.voidstones

  return (
    <>
      <GoToTop />
      <Navbar />
      <div className="container-fluid p-2 row g-0">
        <MapFilter sidebar={false} />
      </div>
      <table className="table table-responsive mb-0">
        <thead>
          <tr>
            <th>Card</th>
            <th>Sources</th>
          </tr>
        </thead>
        <tbody>
          {filteredCards.value.map(c => (
            <Card key={c.name} card={c} voidstones={voidstones} />
          ))}
        </tbody>
      </table>
      <Footer />
    </>
  )
}

export default CardsRoute
