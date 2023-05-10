import cards from './cards.json'
import maps from './maps.json'

export const cardMinPrice = 10
export const cardBossMulti = 3.5
export const cardNameBaseline = "The Chains that Bind"
export const cardWeightBaseline = cards.find(c => c.name === cardNameBaseline).weight

function slipFloor(num){
  let f = Math.floor(num);
  if(num - f < 0.5){
    return f;
  }
  return f + 0.5;
}

function rescale(value, minValue, maxValue, scale) {
  return slipFloor(Math.min((scale * (value - minValue)) / (maxValue - minValue), scale))
}

export function calculateScore(dataset, range) {
  const nonzerodataset = dataset.filter(m => m.value !== undefined && m.value != null)
  const min = Math.min(...nonzerodataset.map(o => o.value))
  const max = Math.max(...nonzerodataset.map(o => o.value))
  const out = []

  for (let entry of dataset) {
    if (entry.value) {
      out.push({
        ...entry,
        score: rescale(entry.value, min, max, range)
      })
    } else {
      out.push(entry)
    }
  }

  return out
}

export const preparedCards = calculateScore(cards
  .map(card => {
    let rate = 0
    if (card.price >= cardMinPrice) {
      rate = card.weight / cardWeightBaseline
    }

    return {
      ...card,
      value: rate * card.price * (card.boss ? (1 / cardBossMulti) : 1)
    }
  })
  .sort((a, b) => b.price - a.price)
  .sort((a, b) => b.value - a.value), 10)

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
      const val = typeof tag == 'boolean' ? name || key.replaceAll('_', ' ') : tag.toLowerCase()
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
  pushTag(map.info, mapTags, map.layout, 'league_mechanics', '+league mechanics')
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
    name: t.name.replace(/\d+ bosses/, 'bosses').replace(/soul of .+/, 'soul of')
  }))
  .sort((a, b) => a.name.localeCompare(b.name))) {
  if (!preparedTagsMap.has(item.name)) {
    preparedTagsMap.set(item.name, true)
    preparedTags.push({
      name: item.name
    })
  }
}