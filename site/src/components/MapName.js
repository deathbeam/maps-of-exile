import Tags from './Tags'
import { mapLevel, mapLevelToTier, tierColor } from '../common'
import Rating from './Rating'
import MapImage from './MapImage'
import { wikiBase } from '../data'

const MapName = ({ map, sidebar, cardList, voidstones }) => {
  const color = `text-${tierColor(map.levels, map.atlas, map.type, voidstones)}`
  const wikiLink = wikiBase + map.name.replaceAll(' ', '_')

  const name = (
    <a href={wikiLink} target="_blank" rel="noreferrer" className={color}>
      {map.name}
    </a>
  )

  const mapName =
    map.image && !sidebar && !cardList ? (
      <span className={'tooltip-tag tooltip-tag-notice ' + (sidebar ? 'tooltip-tag-bottom' : 'tooltip-tag-right')}>
        <span className="tooltip-tag-text tooltip-tag-fill">
          <img src={map.image} alt="" loading="lazy" />
        </span>
        {name}
      </span>
    ) : (
      name
    )

  let mapTags = []
  if (cardList) {
    mapTags.push({
      name: map.type,
      color: 'info'
    })
    if (map.atlas) {
      mapTags.push({
        name: 'atlas',
        color: 'info'
      })
    }
  } else {
    mapTags = map.tags
  }

  const tags = <Tags tags={mapTags} />
  const icon = <MapImage icon={map.icon} type={map.type} level={mapLevel(map.levels, map.atlas, voidstones)} />
  const score = !sidebar && <Rating rating={map.score} scale={10} />

  let tiers
  if (map.atlas) {
    tiers = []
    for (let i = 0; i < map.levels.length; i++) {
      const tier = mapLevelToTier(map.levels[i])
      const isCurrent = i === voidstones
      const isLast = i === map.levels.length - 1
      const suff = isLast ? '' : ', '
      tiers.push(
        isCurrent ? (
          <>
            <b>{tier}</b>
            {suff}
          </>
        ) : (
          tier + suff
        )
      )
    }
  } else {
    tiers = 'Level ' + map.levels.join(', ')
  }

  return (
    <>
      <div className="d-md-flex flex-row">
        <div className="pe-2 pb-2">
          {icon}
          {score}
        </div>
        <div>
          {mapName}
          <br />
          <small>{tiers}</small>
          <br />
          {!sidebar && tags}
        </div>
      </div>
      {sidebar && tags}
    </>
  )
}

export default MapName
