import 'bootstrap/dist/css/bootstrap.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './App.css'

import { Route, HashRouter as Router, Routes } from 'react-router-dom'
import { issueTemplate } from './data'
import Loader from './components/Loader'
import ListRoute from './routes/ListRoute'
import AtlasRoute from './routes/AtlasRoute'
import CardsRoute from './routes/CardsRoute'
import ScrollToTop from './components/ScrollToTop'
import { useTransition } from 'react'

function App() {
  const [pending, startTransition] = useTransition()

  return (
    <Router>
      <ScrollToTop />
      <Loader loading={pending} />
      <a
        className="btn btn-primary position-fixed top-0 start-0 m-2 on-top"
        href={issueTemplate}
        target="_blank"
        rel="noreferrer"
      >
        <i className="fa-solid fa-fw fa-code-fork" /> Data incorrect or missing? Open an issue
      </a>
      <Routes>
        <Route path="/" element={<ListRoute startTransition={startTransition} />} />
        <Route path="/atlas" element={<AtlasRoute startTransition={startTransition} />} />
        <Route path="/atlas/:currentMap" element={<AtlasRoute startTransition={startTransition} />} />
        <Route path="/cards" element={<CardsRoute startTransition={startTransition} />} />
      </Routes>
    </Router>
  )
}

export default App
