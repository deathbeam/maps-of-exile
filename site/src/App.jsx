import '@fortawesome/fontawesome-free/css/all.min.css'
import 'bootstrap/dist/css/bootstrap.css'
import { Route, HashRouter as Router, Routes } from 'react-router-dom'

import './App.css'
import ScrollToTop from './components/ScrollToTop'
import { issueTemplate } from './constants'
import AtlasRoute from './routes/AtlasRoute'
import CardsRoute from './routes/CardsRoute'
import ListRoute from './routes/ListRoute'

function App() {
  return (
    <Router>
      <ScrollToTop />
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
