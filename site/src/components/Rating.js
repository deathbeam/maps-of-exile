import { ratingColor } from '../common'

const Rating = ({ rating, tooltip, label = '', scale = 1 }) => {
  const badgeClass = `m-1 badge badge-fw text-dark bg-${ratingColor(rating, scale)}`

  if (rating == null) {
    rating = '?'
  }

  const badge = (
    <span className={badgeClass}>
      <b>{rating}</b>
      {label && ' ' + label}
    </span>
  )

  if (tooltip) {
    return (
      <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
        <span className="tooltip-tag-text">{tooltip}</span>
        {badge}
      </span>
    )
  }

  return badge
}

export default Rating
