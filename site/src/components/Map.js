import MapName from './MapName'
import Rating from './Rating'
import MapBoss from './MapBoss'
import MapConnected from './MapConnected'
import MapCards from './MapCards'
import useLazy from '../hooks/useLazy'

const Map = ({ map, currentSearch, addToInput }) => {
  const ref = useLazy()

  return (
    <tr
      style={{
        backgroundImage: 'linear-gradient(rgba(33, 37, 41, 0.7), rgba(33, 37, 41, 0.7)), url(' + (map.image || '') + ')'
      }}
      ref={ref}
      className="map-image lazy-bg"
    >
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
        <MapCards cards={map.cards} />
      </td>
    </tr>
  )
}

export default Map
