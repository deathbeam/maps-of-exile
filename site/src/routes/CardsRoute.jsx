import { useAtomValue } from 'jotai'
import { useDeferredValue } from 'react'

import Footer from '../components/Footer'
import GoToTop from '../components/GoToTop'
import Loader from '../components/Loader'
import MapFilter from '../components/MapFilter'
import Navbar from '../components/Navbar'
import Card from '../components/cards/Card'
import state from '../state'

const CardsRoute = () => {
  const filteredCards = useAtomValue(state.filteredCards)
  const deferredCards = useDeferredValue(filteredCards)
  const loading = filteredCards !== deferredCards

  return (
    <>
      <Loader loading={loading} />
      <GoToTop />
      <Navbar />
      <div className="container-fluid p-2 row g-0">
        <MapFilter sidebar={false} />
      </div>
      <table className="table table-responsive mb-0">
        <thead>
          <tr>
            <th className="d-none d-md-table-cell">Card</th>
            <th>Sources</th>
          </tr>
        </thead>
        <tbody>
          {deferredCards.map(c => (
            <Card key={c.name} card={c} />
          ))}
        </tbody>
      </table>
      <Footer />
    </>
  )
}

export default CardsRoute
