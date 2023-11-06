import { ratingColor } from '../common'
import { memo } from 'react'

const Rating = ({ rating, tooltip, sidebar = false, label = '', scale = 1 }) => {
  const badgeClass = `m-1 badge badge-fw text-dark bg-${ratingColor(rating, scale)}`

  if (rating == null) {
    rating = '?'
  } else {
    const scalar = 100 / scale
    rating = Math.floor(rating * scalar) / scalar
  }

  const badge = (
    <span className={badgeClass}>
      <b>{rating}</b>
      {label && ` ${label}`}
    </span>
  )

  if (tooltip) {
    return (
      <span className={`tooltip-tag tooltip-tag-notice ${sidebar ? 'tooltip-tag-left' : 'tooltip-tag-right'}`}>
        <span className="tooltip-tag-text">{tooltip}</span>
        {badge}
      </span>
    )
  }

  return badge
}

export default memo(Rating)
