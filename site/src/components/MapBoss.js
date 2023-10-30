import Rating from './Rating'
import { preparedMonsters } from '../data'

const MapBoss = ({ boss, rating, tooltip }) => {
  const badge = <Rating rating={rating} />

  if (boss.ids || tooltip) {
    return (
      <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
        <span className="tooltip-tag-text">
          {boss.ids &&
            boss.ids.map(b => (
              <b>
                {preparedMonsters[b] || b}
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
