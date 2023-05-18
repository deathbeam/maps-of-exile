import Tags from './Tags'
import { tierColor } from '../common'
import Rating from './Rating'

const MapName = ({ map, currentSearch, addToInput }) => {
  const mapImage =
    process.env.PUBLIC_URL +
    '/layout/' +
    map.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replaceAll(' ', '_') +
    '.png'

  const color = `text-${tierColor(map)}`

  const name = (
    <a href={map.wiki} target="_blank" rel="noreferrer" className={color}>
      {map.name}
    </a>
  )

  const mapName = map.image ? (
    <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
      <span className="tooltip-tag-text tooltip-tag-fill">
        <img src={mapImage} alt="" loading="lazy" />
      </span>
      {name}
    </span>
  ) : (
    name
  )

  const tags = <Tags tags={map.tags} currentSearch={currentSearch} addToInput={addToInput} />
  const icon = <img src={map.icon} alt="" loading="lazy" width="47" height="47" />
  const score = (
    <span className="d-none d-md-block">
      <Rating rating={map.score} scale={10} />
    </span>
  )

  return (
    <div className="d-md-flex flex-row">
      <div className="text-center pe-2 pb-2">
        {icon}
        {score}
      </div>
      <div>
        {mapName}
        <br />
        <small>{map.tiers.join(', ')}</small>
        <br />
        {tags}
      </div>
    </div>
  )
}

export default MapName
