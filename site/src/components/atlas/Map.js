import MapName from '../MapName'
import Rating from '../Rating'
import MapCards from '../MapCards'
import MapBoss from '../MapBoss'

const Map = ({ map, cardValueSourceInput, voidstones }) => (
  <>
    {map.image && <img src={map.image} alt="" className="w-100 mb-1" loading="lazy" />}
    <MapName map={map} sidebar={true} voidstones={voidstones} />
    <hr />
    <Rating rating={map.score} scale={10} label="Total" />
    <Rating rating={map.rating.layout} label="Layout" tooltip={map.info.layout} sidebar={true} />
    <Rating rating={map.rating.density} label="Density" tooltip={map.info.density} sidebar={true} />
    <MapBoss ids={map.boss_ids} rating={map.rating.boss} tooltip={map.info.boss} label="Boss" sidebar={true} />
    <hr />
    <MapCards
      cards={map.cards}
      type={map.type}
      cardValueSourceInput={cardValueSourceInput}
      sidebar={true}
      tooltipTop={!!map.image}
    />
  </>
)

export default Map
