import Rating from './Rating'
import { preparedMonsters } from '../data'
import { memo } from 'react'

const MapBoss = ({ boss, rating, tooltip, sidebar = false, label = '' }) => {
  const badge = <Rating rating={rating} sidebar={sidebar} label={label} />

  if (boss.ids || tooltip) {
    return (
      <span className={'tooltip-tag tooltip-tag-notice ' + (sidebar ? 'tooltip-tag-left' : 'tooltip-tag-right')}>
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

export default memo(MapBoss)
