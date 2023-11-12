import '@fortawesome/fontawesome-free/css/all.css'
import 'bootstrap/dist/css/bootstrap.css'
import { useAtomValue } from 'jotai'

import './App.css'
import ScrollToTop from './components/ScrollToTop'
import { issueTemplate } from './constants'
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
  return (
    <>
      <ScrollToTop />
      <a
        className="btn btn-primary position-fixed top-0 start-0 m-2 on-top"
        href={issueTemplate}
        target="_blank"
        rel="noreferrer"
      >
        <i className="fa-solid fa-fw fa-code-fork" /> Data incorrect or missing? Open an issue
      </a>
      <Routes />
    </>
  )
}

export default App
