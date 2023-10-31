import Tags from './Tags'
import { tierColor } from '../common'
import Rating from './Rating'
import MapImage from './MapImage'

const MapName = ({ map, sidebar, cardList, currentSearch, addToInput, voidstones }) => {
  const color = `text-${tierColor(map.tiers, map.type, voidstones)}`

  const name = (
    <a href={map.wiki} target="_blank" rel="noreferrer" className={color}>
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

  const tags = <Tags tags={mapTags} currentSearch={currentSearch} addToInput={addToInput} />
  const icon = <MapImage icon={map.icon} type={map.type} tier={map.tiers[voidstones]} />
  const score = !sidebar && (
    <span className="d-none d-md-block">
      <Rating rating={map.score} scale={10} />
    </span>
  )

  let tiers
  if (map.atlas) {
    tiers = []
    for (let i = 0; i < map.tiers.length; i++) {
      const tier = map.tiers[i]
      const isCurrent = i === voidstones
      const isLast = i === map.tiers.length - 1
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
    tiers = 'Area Level ' + map.level
  }

  return (
    <>
      <div className="d-lg-flex flex-row">
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
