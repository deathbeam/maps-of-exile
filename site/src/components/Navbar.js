import { memo } from 'react'

const getButtonClass = (toCheck, cur) => (toCheck === cur ? 'btn-primary' : 'btn-outline-primary')

const Navbar = ({ view, setView, showBack, backAction }) => (
  <nav className="navbar navbar-dark bg-dark">
    {showBack && (
      <button className="btn btn-outline-primary ms-2" onClick={e => backAction()}>
        <i className="fa-solid fa-fw fa-backward-step" /> Back
      </button>
    )}
    <div className="btn-group ms-auto me-2">
      <button className={'btn ' + getButtonClass('list', view)} onClick={e => setView('list')}>
        <i className="fa-solid fa-fw fa-list" /> List
      </button>
      <button className={'btn d-none d-md-block ' + getButtonClass('atlas', view)} onClick={e => setView('atlas')}>
        <i className="fa-solid fa-fw fa-globe" /> Atlas <span className="badge bg-danger text-dark ms-1">new</span>
      </button>
      <button className={'btn ' + getButtonClass('cards', view)} onClick={e => setView('cards')}>
        <i className="fa-solid fa-fw fa-sd-card" /> Cards <span className="badge bg-danger text-dark ms-1">new</span>
      </button>
    </div>
  </nav>
)

export default memo(Navbar)
