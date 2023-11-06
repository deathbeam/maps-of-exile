const CardRateTooltip = ({ card, full }) => {
  if (!card.rate) {
    return null
  }

  const perDescription = card.rate.everyMap > 1 ? `${card.source}s` : card.source
  return full ? (
    <>
      <b>{card.weight}</b> (card weight)
      <br />/ <b>{card.totalWeight}</b> (drop pool weight)
      {card.dropPoolItems > 1 && (
        <>
          <br />* <b>{Math.round(card.dropPoolItems)}</b> (drop pool items)
        </>
      )}
      <br />= <b>{card.rate.perMap}</b> every <b>{card.rate.everyMap > 1 && card.rate.everyMap}</b> {perDescription}
      <br />= <b>{card.rate.value}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per {card.source}
      <br />
    </>
  ) : (
    <>
      <b>{card.rate.perMap}</b> <b>{card.name}</b> every <b>{card.rate.everyMap > 1 && card.rate.everyMap}</b>{' '}
      {perDescription}
      <br />= <b>{card.rate.value}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per {card.source}
      <br />
    </>
  )
}

export default CardRateTooltip
