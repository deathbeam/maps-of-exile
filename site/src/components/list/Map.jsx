import { useAtomValue } from 'jotai'

import useLazy from '../../hooks/useLazy'
import state from '../../state'
import MapBoss from '../MapBoss'
import MapCards from '../MapCards'
import MapName from '../MapName'
import Rating from '../Rating'
import './Map.css'
import MapConnected from './MapConnected'

const Map = ({ map }) => {
  const [ref, visible] = useLazy()
  const voidstones = useAtomValue(state.input.voidstones)

  return (
    <tr id={map.name} ref={ref} className="map-list">
      <td>
        <MapName map={map} voidstones={voidstones} />
        <div className="d-lg-none mt-2">
          <Rating rating={map.rating.layout} label="Layout" />
          <Rating rating={map.rating.density} label="Density" />
          <Rating rating={map.rating.boss} label="Boss" />
        </div>
      </td>
      {visible ? (
        <>
          <td className="text-center d-none d-lg-table-cell">
            <Rating rating={map.rating.layout} tooltip={map.info.layout} />
          </td>
          <td className="text-center d-none d-lg-table-cell">
            <Rating rating={map.rating.density} tooltip={map.info.density} />
          </td>
          <td className="text-center d-none d-lg-table-cell">
            <MapBoss names={map.boss_names} rating={map.rating.boss} tooltip={map.info.boss} />
          </td>
          <td className="d-none d-md-table-cell">
            <MapConnected connected={map.connected} />
          </td>
          <td>
            <MapCards cards={map.cards} rating={map.sort.card} />
          </td>
        </>
      ) : (
        <>
          <td className="d-none d-lg-table-cell" />
          <td className="d-none d-lg-table-cell" />
          <td className="d-none d-lg-table-cell" />
          <td className="d-none d-md-table-cell" />
          <td />
        </>
      )}
    </tr>
  )
}

export default Map
