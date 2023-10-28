import { ratingColor, scrollToElement } from '../common'

const MapConnected = ({ connected, onClick = scrollToElement }) => {
  return connected.map(m => (
    <>
      <button className="btn btn-dark text-body m-1" onClick={() => onClick(m.name)}>
        <b className={`text-${ratingColor(m.score, 10)}`}>{Math.round(m.score) + ' '}</b>
        {m.name}
      </button>
      <br />
    </>
  ))
}

export default MapConnected
