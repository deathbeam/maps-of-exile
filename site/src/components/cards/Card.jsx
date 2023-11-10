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
      <td className="p-0 map-card">
        <div
          style={{
            backgroundColor: 'black'
          }}
          className="p-1"
        >
          <CardDetail card={card} />
        </div>
      </td>
      {visible ? (
        <td>
          <div className="row m-0">
            <CardNotice card={card} />
          </div>
          <div className="row m-0">
            {card.monsters.map(m => (
              <div key={m.name} className="col-12 col-sm-6 col-md-4 col-lg-2 mt-2">
                <MonsterName monster={m} />
              </div>
            ))}
          </div>
          <div className="row m-0">
            {card.maps.map(map => (
              <div key={map.name} className="col-12 col-sm-6 col-md-4 col-lg-2 mt-2">
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
