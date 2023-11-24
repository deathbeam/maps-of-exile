import { memo } from 'react'

import { mapLevelToTier } from '../common'
import './MapImage.css'

const MapImage = ({ icon, level = 0, type = 'map' }) => {
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
  if (icon.includes('Atlas2Maps')) {
    extraClass = ' map-background'
  }

  return (
    <div className={'map-icon-container d-inline-block d-md-block' + extraClass}>
      <img loading="lazy" src={icon} className={color} alt="" />
    </div>
  )
}

export default memo(MapImage)
