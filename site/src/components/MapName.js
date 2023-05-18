import Tags from './Tags'
import { tierColor } from '../common'

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
  const tags = <Tags tags={map.tags} currentSearch={currentSearch} addToInput={addToInput} />

  return map.image ? (
    <>
      <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
        <span className="tooltip-tag-text tooltip-tag-fill">
          <img src={mapImage} alt="" loading="lazy" />
        </span>
        {name}
      </span>
      <br />
      <small>{map.tiers.join(', ')}</small>
      <br />
      {tags}
    </>
  ) : (
    <>
      {name}
      <br />
      <small>{map.tiers.join(', ')}</small>
      <br />
      {tags}
    </>
  )
}

export default MapName
