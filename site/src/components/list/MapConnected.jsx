import { ratingColor, scrollToElement } from '../../common'
import { memo } from 'react'

const MapConnected = ({ connected, onClick = scrollToElement }) => {
  return connected.map(m => (
    <span key={m.name}>
      <button className="btn btn-dark text-body m-1" onClick={() => onClick(m.name)}>
        <b className={`text-${ratingColor(m.score, 10)}`}>{Math.round(m.score) + ' '}</b>
        {m.name}
      </button>
      <br />
    </span>
  ))
}

export default memo(MapConnected)
