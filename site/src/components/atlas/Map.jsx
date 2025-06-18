import { useAtomValue } from 'jotai'

import state from '../../state'
import MapBoss from '../MapBoss'
import MapCards from '../MapCards'
import MapName from '../MapName'
import Rating from '../Rating'

const Map = ({ map }) => {
  const voidstones = useAtomValue(state.input.voidstones)

  return (
    <>
      {map.image && (
        <a href={map.image} target="_blank" rel="noreferrer">
          <img src={map.image} alt="" className="w-100 mb-1" loading="lazy" />
        </a>
      )}
      <MapName map={map} voidstones={voidstones} sidebar={true} />
      <hr />
      <Rating rating={map.score} scale={10} label="Total" />
      <Rating rating={map.rating.layout} label="Layout" tooltip={map.info.layout} sidebar={true} />
      <Rating rating={map.rating.density} label="Density" tooltip={map.info.density} sidebar={true} />
      <MapBoss names={map.boss_names} rating={map.rating.boss} tooltip={map.info.boss} label="Boss" sidebar={true} />
      <hr />
      <MapCards cards={map.cards} rating={map.sort.card} sidebar={true} tooltipTop={!!map.image} />
    </>
  )
}

export default Map
