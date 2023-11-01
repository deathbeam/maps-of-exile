import './MapImage.css'
import { memo } from 'react'
import { mapLevelToTier } from '../common'

const MapImage = ({ icon, level = 0, type = 'map', onClick = null }) => {
  if (type === 'act area') {
    icon = '/img/act.webp'
  }

  if (!icon) {
    return null
  }

  let color = 'map-white'
  const tier = mapLevelToTier(level)
  if (type !== 'map') {
    color = ''
  } else if (tier >= 11) {
    color = 'map-red'
  } else if (tier >= 6) {
    color = 'map-yellow'
  }

  let extraClass = ''
  if (icon.includes('Atlas') && icon.includes('Maps')) {
    extraClass = ' map-background'
  }

  return (
    <div className={'map-icon-container d-inline-block d-md-block' + extraClass} onClick={onClick}>
      <img loading="lazy" src={icon} className={color} alt="" />
    </div>
  )
}

export default memo(MapImage)
