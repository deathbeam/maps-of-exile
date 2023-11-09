import useLazy from '../../hooks/useLazy'
import { divcordDiscord, wikiBase } from '../../data'
import CardDetail from '../CardDetail'
import MapName from '../MapName'
import MonsterName from './MonsterName'
import CardRateTooltip from '../CardRateTooltip.jsx'

const Card = ({ card, voidstones }) => {
  const [ref, visible] = useLazy()

  let cardNotice = null
  if (!card.drop.text && (card.drop.monsters || []).length === 0 && (card.drop.areas || []).length === 0) {
    cardNotice = (
      <div className="card p-0 mb-2 bg-danger-subtle text-white">
        <div className="card-header">{card.name} has no confirmed drop sources.</div>
        <div className="card-body">
          If you find one that did not come from sources of random divination cards — including{' '}
          <a href={`${wikiBase}Stacked_Deck`} target="_blank" rel="noreferrer">
            Stacked Decks
          </a>
          ,{' '}
          <a href={`${wikiBase}Headmistress_Braeta`} target="_blank" rel="noreferrer">
            Headmistress Braeta
          </a>
          , and divination card rewards — consider posting a screenshot to the{' '}
          <a href={divcordDiscord} target="_blank" rel="noreferrer">
            Divination Card Discord
          </a>
          , also known as{' '}
          <a href={`${wikiBase}Divcord`} target="_blank" rel="noreferrer">
            Divcord
          </a>
          .{card.drop.text}
        </div>
      </div>
    )
  } else if (card.drop.text) {
    cardNotice = (
      <div className="card p-0 mb-2">
        <div className="card-body">{card.drop.text}</div>
      </div>
    )
  } else if (
    card.maps.length === 0 &&
    card.monsters.length === 0 &&
    (card.drop.monsters.length > 0 || card.drop.areas.length) > 0
  ) {
    cardNotice = (
      <div className="card p-0 mb-2 bg-warning-subtle text-white">
        <div className="card-header">
          {card.name} has drop sources but they are either hidden with filters or site is missing data for them.
        </div>
        <div className="card-body">
          If you want to try to see them set <b>Card display</b> to <b>All cards</b> and/or <b>Map display</b> to{' '}
          <b>All areas</b>. If you still do not see them check{' '}
          <a href={wikiBase + card.name} target="_blank" rel="noreferrer">
            Wiki
          </a>
          .
        </div>
      </div>
    )
  }

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
          <div className="row m-0">{cardNotice}</div>
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
        <td />
      )}
    </tr>
  )
}

export default Card
