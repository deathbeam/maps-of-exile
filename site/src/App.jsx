import '@fortawesome/fontawesome-free/css/all.css'
import 'bootstrap/dist/css/bootstrap.css'
import { useAtom, useAtomValue } from 'jotai'

import './App.css'
import ScrollToTop from './components/ScrollToTop'
import { issueTemplate } from './constants'
import { globals } from './constants'
import AtlasRoute from './routes/AtlasRoute'
import CardsRoute from './routes/CardsRoute'
import ListRoute from './routes/ListRoute'
import state from './state'

const Routes = () => {
  const [route] = useAtomValue(state.location)
  switch (route) {
    case 'atlas':
      return <AtlasRoute />
    case 'cards':
      return <CardsRoute />
    default:
      return <ListRoute />
  }
}

function App() {
  const [cardPricesAlert, setCardPricesAlert] = useAtom(state.alerts.cardPrices)
  const [newLeagueAlert, setNewLeagueAlert] = useAtom(state.alerts.newLeague)

  return (
    <>
      <ScrollToTop />
      <a
        className="btn btn-primary position-fixed top-0 start-0 m-2 on-top"
        href={issueTemplate}
        target="_blank"
        rel="noreferrer"
      >
        <i className="fa-solid fa-fw fa-code-fork" />{' '}
        <span className="d-none d-md-inline">Data incorrect or missing? Open an issue</span>
      </a>
      {cardPricesAlert && (
        <div className="alert alert-primary position-fixed end-0 bottom-0 m-2 on-top" role="alert">
          <b>New!</b> Currency cards under <b>100c</b> are now priced based on <b>poe.ninja</b> currency values to
          improve accuracy.
          <button type="button" className="btn-close" onClick={() => setCardPricesAlert(false)} />
        </div>
      )}
      {newLeagueAlert && (
        <div className="alert alert-primary position-fixed end-0 bottom-0 m-2 on-top" role="alert">
          <b>New!</b> Site was updated for <b>{globals.league}</b> league. If price data are not reliable yet, switch{' '}
          <b>Card price source</b> to <b>Standard</b>.
          <button type="button" className="btn-close" onClick={() => setNewLeagueAlert(null)} />
        </div>
      )}
      <Routes />
    </>
  )
}

export default App
