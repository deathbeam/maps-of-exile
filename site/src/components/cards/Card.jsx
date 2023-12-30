import { useAtomValue } from 'jotai'
import { memo } from 'react'

import useLazy from '../../hooks/useLazy'
import state from '../../state'
import CardDetail from '../CardDetail'
import CardRateTooltip from '../CardRateTooltip'
import MapName from '../MapName'
import CardNotice from './CardNotice.jsx'
import MonsterName from './MonsterName'

const Card = ({ card }) => {
  const [ref, visible] = useLazy()
  const voidstones = useAtomValue(state.input.voidstones)

  return (
    <tr id={card.name} ref={ref}>
      <td className="d-none d-md-table-cell p-0 map-card">
        <div className="p-1 m-2 bg-black">
          <CardDetail card={card} />
        </div>
      </td>
      {visible ? (
        <td>
          <div className="p-1 bg-black d-block d-md-none mb-2">
            <CardDetail card={card} />
          </div>
          <div className="row m-0">
            <CardNotice card={card} />
          </div>
          <div className="row m-0">
            {card.monsters.map(m => (
              <div key={m.name} className="col-6 col-lg-3 col-xl-2 mb-2">
                <MonsterName monster={m} />
              </div>
            ))}
          </div>
          <div className="row m-0">
            {card.maps.map(map => (
              <div key={map.name} className="col-6 col-lg-3 col-xl-2 mb-2">
                <span className="tooltip-tag tooltip-tag-bottom">
                  <span className="tooltip-tag-text">
                    <CardRateTooltip card={map.card} full={true} />
                  </span>
                  <MapName map={map} voidstones={voidstones} cardList={true} />
                </span>
              </div>
            ))}
          </div>
        </td>
      ) : (
        <td></td>
      )}
    </tr>
  )
}

export default memo(Card)
