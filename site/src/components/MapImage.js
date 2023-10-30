import './MapImage.css'

const MapImage = ({ icon, tier = 0, unique = false, onClick = null }) => {
  if (!icon) {
    return null
  }

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

  let extraClass = ''
  if (!unique) {
    extraClass = ' map-background'
  }

  return (
    <div className={'map-icon-container' + extraClass} onClick={onClick}>
      <img loading="lazy" src={icon} className={color} alt="" />
    </div>
  )
}

export default MapImage
