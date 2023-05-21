import MapName from './MapName'
import Rating from './Rating'
import MapBoss from './MapBoss'
import MapConnected from './MapConnected'
import MapCards from './MapCards'

const Map = ({ map, hideLowValueCards, currentSearch, addToInput }) => (
  <>
    <td>
      <MapName map={map} currentSearch={currentSearch} addToInput={addToInput} />
      <div className="d-md-none mt-2">
        <Rating rating={map.score} scale={10} label="Total" />
        <Rating rating={map.rating.layout} label="Layout" />
        <Rating rating={map.rating.density} label="Density" />
        <Rating rating={map.rating.boss} label="Boss" />
      </div>
    </td>
    <td className="text-center d-none d-md-table-cell">
      <Rating rating={map.rating.layout} tooltip={map.info.layout} />
    </td>
    <td className="text-center d-none d-md-table-cell">
      <Rating rating={map.rating.density} tooltip={map.info.density} />
    </td>
    <td className="text-center d-none d-md-table-cell">
      <MapBoss boss={map.boss} rating={map.rating.boss} tooltip={map.info.boss} />
    </td>
    <td>
      <MapConnected connected={map.connected} />
    </td>
    <td>
      <MapCards cards={map.cards} hideLowValueCards={hideLowValueCards} />
    </td>
  </>
)

export default Map
