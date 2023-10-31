import MapName from './MapName'
import Rating from './Rating'
import MapCards from './MapCards'
import MapBoss from './MapBoss'

const MapSidebar = ({ map, currentSearch, addToInput, cardValueSourceInput, voidstones, setCurrentMap }) => (
  <>
    {map.image && <img src={map.image} alt="" className="w-100 mb-1" loading="lazy" />}
    <MapName map={map} sidebar={true} currentSearch={currentSearch} addToInput={addToInput} voidstones={voidstones} />
    <hr />
    <Rating rating={map.score} scale={10} label="Total" />
    <Rating rating={map.rating.layout} label="Layout" tooltip={map.info.layout} sidebar={true} />
    <Rating rating={map.rating.density} label="Density" tooltip={map.info.density} sidebar={true} />
    <MapBoss boss={map.boss} rating={map.rating.boss} tooltip={map.info.boss} label="Boss" sidebar={true} />
    <hr />
    <MapCards
      sidebar={true}
      tooltipTop={!!map.image}
      cardValueSourceInput={cardValueSourceInput}
      type={map.type}
      cards={map.cards}
    />
  </>
)

export default MapSidebar
