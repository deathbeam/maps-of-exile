import { memo } from 'react'

import { divcordDiscord, wikiBase } from '../../constants'

const CardNotice = ({ card }) => {
  let cardNotice = null
  if (!card.drop.text && (card.drop.monsters || []).length === 0 && (card.drop.areas || []).length === 0) {
    cardNotice = (
      <div className="card p-0 mb-2 bg-danger-subtle text-white">
        <div className="card-header">{card.name} has no confirmed drop sources.</div>
        <div className="card-body">
          If you find one that did not come from sources of random divination cards — including{' '}
          <a href={wikiBase + 'Stacked_Deck'} target="_blank" rel="noreferrer">
            Stacked Decks
          </a>
          ,{' '}
          <a href={wikiBase + 'Headmistress_Braeta'} target="_blank" rel="noreferrer">
            Headmistress Braeta
          </a>
          , and divination card rewards — consider posting a screenshot to the{' '}
          <a href={divcordDiscord} target="_blank" rel="noreferrer">
            Divination Card Discord
          </a>
          , also known as{' '}
          <a href={wikiBase + 'Divcord'} target="_blank" rel="noreferrer">
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

  return cardNotice
}

export default memo(CardNotice)
