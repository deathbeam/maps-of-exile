import cards from './cards.json'
import maps from './maps.json'

export const preparedCards = cards
  .map(card => {
    return {
      value: card.rate ? parseFloat(card.price) * parseFloat(card.rate) : null,
      ...card
    }
  })
  .sort((a, b) => b.price - a.price)
  .sort((a, b) => (b.value || 0) - (a.value || 0))

export const preparedMaps = maps.map(map => {
  const mapCards = []

  for (let card of map.cards) {
    const cardData = preparedCards.find(c => c.name === card)
    if (cardData) {
      mapCards.push({
        ...cardData
      })
    } else {
      mapCards.push({
        name: card
      })
    }
  }

  const mapTags = []
  if (map.layout.few_obstacles) {
    mapTags.push('few obstacles')
  }
  if (map.layout.outdoors) {
    mapTags.push('outdoors')
  }
  if (map.layout.linear) {
    mapTags.push('linear')
  }
  if (map.pantheon) {
    mapTags.push(map.pantheon.toLowerCase())
  }
  if (map.layout.good_for_open_mechanics) {
    mapTags.push('+league mechanics')
  }
  if (map.layout.good_for_deli_mirror) {
    mapTags.push('+delirium mirror')
  }
  if (map.boss.names) {
    const names = map.boss.names.filter(n => !n.includes('Merveil'))
    if (names.length > 1) {
      mapTags.push(`${names.length} bosses`)
    }
  }
  if (map.boss.separated) {
    mapTags.push('boss separated')
  }
  if (map.boss.not_spawned) {
    mapTags.push('boss not spawned')
  }
  if (map.boss.close_to_start) {
    mapTags.push('boss rushable')
  }
  if (map.boss.phases) {
    mapTags.push('-boss with phases')
  }
  if (map.boss.soft_phases) {
    mapTags.push('boss with soft phases')
  }

  return {
    ...map,
    name: map.name.replace(' Map', ''),
    connected: (map.connected || []).map(c => c.replace(' Map', '')),
    cards: mapCards,
    tags: mapTags.sort()
  }
})

export const preparedTags = [
  ...new Set(
    preparedMaps
      .flatMap(m => m.tags)
      .map(t => t.replace(/\d+ bosses/, 'bosses'))
      .map(t => t.replace(/soul of .+/, 'soul of'))
  )
].sort()
