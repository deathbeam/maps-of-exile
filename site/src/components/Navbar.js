import { memo } from 'react'
import { Link, NavLink } from 'react-router-dom'

const getButtonClass = ({ isActive }) => (isActive ? 'btn btn-primary' : 'btn btn-outline-primary')

const Navbar = ({ showBack }) => {
  return (
    <nav className="navbar navbar-dark bg-dark">
      {showBack && (
        <Link to={showBack} className="btn btn-outline-primary ms-2">
          <i className="fa-solid fa-fw fa-backward-step" /> Back
        </Link>
      )}
      <div className="btn-group ms-auto me-2">
        <NavLink className={getButtonClass} to="/">
          <i className="fa-solid fa-fw fa-list" /> List
        </NavLink>
        <NavLink className={getButtonClass} to="/atlas">
          <i className="fa-solid fa-fw fa-globe" /> Atlas <span className="badge bg-danger text-dark ms-1">new</span>
        </NavLink>
        <NavLink className={getButtonClass} to="/cards">
          <i className="fa-solid fa-fw fa-sd-card" /> Cards <span className="badge bg-danger text-dark ms-1">new</span>
        </NavLink>
      </div>
    </nav>
  )
}

export default memo(Navbar)
