const Rating = ({ rating, tooltip }) => {
  let badgeClass = 'bg-danger'

  if (rating == null) {
    badgeClass = 'bg-secondary'
    rating = '?'
  } else {
    if (rating >= 7) {
      badgeClass = 'bg-success'
    } else if (rating >= 5) {
      badgeClass = 'bg-info'
    } else if (rating >= 3) {
      badgeClass = 'bg-warning'
    }
  }

  badgeClass = `badge text-dark ${badgeClass}`
  const badge = <span className={badgeClass}>{rating}</span>

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
