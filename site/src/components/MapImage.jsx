import './MapImage.css'
import { memo } from 'react'
import { mapLevelToTier } from '../common'

const MapImage = ({ icon, name, level = 0, type = 'map' }) => {
  if (type === 'act area') {
    icon = '/img/act.webp'
  }

  if (name.startsWith('Trial of ')) {
    icon = '/img/labyrinth.webp'
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
