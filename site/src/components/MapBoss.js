import Rating from './Rating'

const MapBoss = ({ boss, rating, tooltip }) => {
  const badge = <Rating rating={rating} />

  if (boss.names || tooltip) {
    return (
      <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
        <span className="tooltip-tag-text">
          {boss.names &&
            boss.names.map(b => (
              <b>
                {b}
                <br />
              </b>
            ))}
          {tooltip || ''}
        </span>
        {badge}
      </span>
    )
  }

  return badge
}

export default MapBoss
