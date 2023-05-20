import './MapImage.css'

const MapImage = ({ icon, tier = 0, unique = false, onClick = null }) => {
  let color = 'map-white'
  if (
    unique ||
    icon.includes('Minotaur') ||
    icon.includes('Hydra') ||
    icon.includes('Chimera') ||
    icon.includes('Phoenix')
  ) {
    color = ''
  } else if (tier >= 11) {
    color = 'map-red'
  } else if (tier >= 6) {
    color = 'map-yellow'
  }

  const style = unique
    ? {}
    : {
        backgroundImage: 'url(/img/map.png)'
      }

  return (
    <div className="map-icon-container" onClick={onClick} style={style}>
      <img loading="lazy" src={icon} className={color} alt="" />
    </div>
  )
}

export default MapImage
