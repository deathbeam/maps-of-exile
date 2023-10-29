import MapName from './MapName'
import Rating from './Rating'
import MapCards from './MapCards'

const MapSidebar = ({ map, currentSearch, addToInput, cardValueSourceInput, voidstones, setCurrentMap }) => (
  <>
    {map.image && <img src={map.image} alt="" className="w-100 mb-1" loading="lazy" />}
    <MapName map={map} sidebar={true} currentSearch={currentSearch} addToInput={addToInput} voidstones={voidstones} />
    <hr />
    <Rating rating={map.score} scale={10} label="Total" />
    <Rating rating={map.rating.layout} label="Layout" tooltip={map.info.layout} sidebar={true} />
    <Rating rating={map.rating.density} label="Density" tooltip={map.info.density} sidebar={true} />
    <Rating rating={map.rating.boss} label="Boss" tooltip={map.info.boss} sidebar={true} />
    <hr />
    <MapCards sidebar={true} cardValueSourceInput={cardValueSourceInput} unique={map.unique} cards={map.cards} />
  </>
)

export default MapSidebar
