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

  function pushTag(info, destination, source, key, name = null) {
    const tag = source[key]

    if (tag) {
      const val =
        typeof tag == 'boolean'
          ? name || key.replaceAll('_', ' ')
          : tag.toLowerCase()
      const out = {
        name: val
      }
      if (info && info[key]) {
        out.info = info[key]
      }
      destination.push(out)
    }
  }

  const mapTags = []
  pushTag(map.info, mapTags, map.layout, 'few_obstacles', 'few obstacles')
  pushTag(map.info, mapTags, map.layout, 'outdoors')
  pushTag(map.info, mapTags, map.layout, 'linear')
  pushTag(
    map.info,
    mapTags,
    map.layout,
    'league_mechanics',
    '+league mechanics'
  )
  pushTag(map.info, mapTags, map.layout, 'delirium_mirror', '+delirium mirror')

  pushTag(map.info, mapTags, map.boss, 'separated', 'boss separated')
  pushTag(map.info, mapTags, map.boss, 'not_spawned', '+boss not spawned')
  pushTag(map.info, mapTags, map.boss, 'rushable', '+boss rushable')
  pushTag(map.info, mapTags, map.boss, 'phases', '-boss with phases')
  pushTag(map.info, mapTags, map.boss, 'soft_phases', 'boss with soft phases')

  pushTag(map.info, mapTags, map, 'pantheon')

  if (map.boss.names) {
    const names = map.boss.names.filter(n => !n.includes('Merveil'))
    if (names.length > 1) {
      mapTags.push({ name: `${names.length} bosses` })
    }
  }

  return {
    ...map,
    name: map.name.replace(' Map', ''),
    connected: (map.connected || []).map(c => c.replace(' Map', '')),
    cards: mapCards,
    tags: mapTags.sort((a, b) => a.name.localeCompare(b.name))
  }
})

export const preparedTags = []
const preparedTagsMap = new Map()
for (const item of preparedMaps
  .flatMap(m => m.tags)
  .map(t => ({
    name: t.name
      .replace(/\d+ bosses/, 'bosses')
      .replace(/soul of .+/, 'soul of')
  }))
  .sort((a, b) => a.name.localeCompare(b.name))) {
  if (!preparedTagsMap.has(item.name)) {
    preparedTagsMap.set(item.name, true)
    preparedTags.push({
      name: item.name
    })
  }
}
