import { ratingColor, scrollToElement } from '../common'

const MapConnected = ({ connected }) => {
  return connected.map(m => (
    <>
      <button className="btn btn-dark m-1" onClick={() => scrollToElement(m.name)}>
        <b className={`text-${ratingColor(m.score, 10)}`}>{Math.round(m.score) + ' '}</b>
        {m.name}
      </button>
      <br />
    </>
  ))
}

export default MapConnected
