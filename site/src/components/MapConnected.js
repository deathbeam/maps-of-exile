import { scrollToElement } from '../common'

const MapConnected = ({ connected, ratedMaps }) => {
  return (connected || []).map(m => (
    <>
      <button className="btn text-dark btn-secondary m-1" onClick={() => scrollToElement(m)}>
        <b>
          {Math.round(
            (ratedMaps.find(rm => rm.name.toLowerCase().trim() === m.toLowerCase().trim()) || {}).score || 0
          ) + ' '}
        </b>
        {m}
      </button>
      <br />
    </>
  ))
}

export default MapConnected
