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
import { useContext } from 'react'
import { AppState } from './state.js'

function App() {
  const { loading } = useContext(AppState)

  return (
    <Router>
      <ScrollToTop />
      <Loader loading={loading} />
      <a
        className="btn btn-primary position-fixed top-0 start-0 m-2 on-top"
        href={issueTemplate}
        target="_blank"
        rel="noreferrer"
      >
        <i className="fa-solid fa-fw fa-code-fork" /> Data incorrect or missing? Open an issue
      </a>
      <Routes>
        <Route path="/" element={<ListRoute />} />
        <Route path="/atlas" element={<AtlasRoute />} />
        <Route path="/atlas/:currentMap" element={<AtlasRoute />} />
        <Route path="/cards" element={<CardsRoute />} />
      </Routes>
    </Router>
  )
}

export default App
