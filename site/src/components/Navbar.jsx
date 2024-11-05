import { useAtomValue } from 'jotai'

import state from '../state'

const getButtonClass = isActive => (isActive ? 'btn btn-primary' : 'btn btn-outline-primary')

const Navbar = ({ close = null }) => {
  const [route] = useAtomValue(state.location)

  return (
    <nav className="navbar navbar-dark bg-dark">
      {close && (
        <a href={close} className="btn btn-outline-primary ms-2">
          <i className="fa-solid fa-fw fa-xmark" />
        </a>
      )}
      <div className="btn-group ms-auto me-2">
        <a className={getButtonClass(!route)} href="/#/">
          <i className="fa-solid fa-fw fa-list" /> List
        </a>
        <a className={'d-none d-lg-block ' + getButtonClass(route === 'atlas')} href="/#/atlas">
          <i className="fa-solid fa-fw fa-globe" /> Atlas
        </a>
        <a className={getButtonClass(route === 'cards')} href="/#/cards">
          <i className="fa-solid fa-fw fa-sd-card" /> Cards
        </a>
      </div>
    </nav>
  )
}

export default Navbar
