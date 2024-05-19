import Rating from './Rating'

const MapBoss = ({ names, rating, tooltip, sidebar = false, label = '' }) => {
  const badge = <Rating rating={rating} sidebar={sidebar} label={label} />

  if (names.length > 0 || tooltip) {
    return (
      <span className={'tooltip-tag tooltip-tag-notice ' + (sidebar ? 'tooltip-tag-left' : 'tooltip-tag-right')}>
        <span className="tooltip-tag-text">
          {names.map(b => (
            <b key={b}>
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
