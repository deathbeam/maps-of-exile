import { scrollToElement } from '../common'

const MapConnected = ({ connected }) => {
  return connected.map(m => (
    <>
      <button className="btn text-dark btn-secondary m-1" onClick={() => scrollToElement(m.name)}>
        <b>{Math.round(m.score) + ' '}</b>
        {m.name}
      </button>
      <br />
    </>
  ))
}

export default MapConnected
