import { wikiBase } from '../../data'

const MonsterName = ({ monster }) => (
  <div className="d-lg-flex flex-row">
    <div className="pe-2 pb-2">
      <div className="map-icon-container">
        <img src="/img/boss.webp" alt="" />
      </div>
    </div>
    <div>
      <a className="text-light" href={wikiBase + monster} target="_blank" rel="noreferrer">
        {monster}
      </a>
      <br />
      <span className="badge bg-warning text-dark">monster</span>
    </div>
  </div>
)

export default MonsterName
