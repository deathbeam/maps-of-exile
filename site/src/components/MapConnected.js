const MapConnected = ({ connected, ratedMaps }) => {
  return (connected || []).map(m => (
    <>
      <a className="badge text-dark bg-secondary me-1" href={'#' + m}>
        <b>
          {Math.round(
            (ratedMaps.find(rm => rm.name.toLowerCase().trim() === m.toLowerCase().trim()) || {}).score || 0
          ) + ' '}
        </b>
        {m}
      </a>
      <br />
    </>
  ))
}

export default MapConnected
