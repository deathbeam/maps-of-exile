import Rating from './Rating'

const MapBoss = ({ boss, rating }) => {
  const badge = <Rating rating={rating} />

  if (boss.names || boss.notes) {
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
          {boss.notes}
        </span>
        {badge}
      </span>
    )
  }

  return badge
}

export default MapBoss
