const CardRateTooltip = ({ rate, description, name }) => {
  const perDescription = rate.everyMap > 1 ? description + 's' : description
  return name ? (
    <>
      <b>{rate.perMap}</b> <b>{name}</b> every <b>{rate.everyMap > 1 && rate.everyMap}</b> {perDescription}
      <br />= <b>{rate.value}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per {description}
      <br />
    </>
  ) : (
    <>
      = <b>{rate.perMap}</b> every <b>{rate.everyMap > 1 && rate.everyMap}</b> {perDescription}
      <br />= <b>{rate.value}</b> <img src="/img/chaos.png" alt="c" width="16" height="16" /> per {description}
      <br />
    </>
  )
}

export default CardRateTooltip
