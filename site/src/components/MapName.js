import Tags from './Tags'

const MapName = ({ map, currentSearch, addToInput }) => {
  const mapImage =
    process.env.PUBLIC_URL +
    '/layout/' +
    map.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replaceAll(' ', '_') +
    '.png'

  const tier = map.tiers[0]
  let tierColor = 'text-light'
  if (tier >= 11) {
    tierColor = 'text-danger'
  } else if (tier >= 6) {
    tierColor = 'text-warning'
  }

  const name = (
    <a href={map.wiki} target="_blank" rel="noreferrer" className={tierColor}>
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
