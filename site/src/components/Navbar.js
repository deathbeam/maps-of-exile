import { memo } from 'react'
import { Link, NavLink } from 'react-router-dom'

const getButtonClass = ({ isActive }) => (isActive ? 'btn btn-primary' : 'btn btn-outline-primary')

const Navbar = ({ close }) => {
  return (
    <nav className="navbar navbar-dark bg-dark">
      {close && (
        <Link to={close} className="btn btn-outline-primary ms-2">
          <i className="fa-solid fa-fw fa-xmark" />
        </Link>
      )}
      <div className="btn-group ms-auto me-2">
        <NavLink className={getButtonClass} to="/">
          <i className="fa-solid fa-fw fa-list" /> List
        </NavLink>
        <NavLink className={getButtonClass} to="/atlas">
          <i className="fa-solid fa-fw fa-globe" /> Atlas
        </NavLink>
        <NavLink className={getButtonClass} to="/cards">
          <i className="fa-solid fa-fw fa-sd-card" /> Cards
        </NavLink>
      </div>
    </nav>
  )
}

export default memo(Navbar)
