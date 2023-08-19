import cards from './cards.json'
import maps from './maps.json'
import globals from './globals.json'
import { mapLevelToTier } from '../common'

const wikiBase = 'https://www.poewiki.net/wiki/'
const mapIconBase = 'https://web.poecdn.com/image/'
const cardArtBase = 'https://web.poecdn.com/image/divination-card/'
export const defaultCardBaseline = 'The Chains that Bind'
export const githubRepo = 'https://github.com/deathbeam/maps-of-exile'
export const issueTemplate = `${githubRepo}/issues/new?labels=map-data&template=map_data.yml&title=Enter+map+name+here`
export const mfAcademyInvite = 'https://discord.gg/mfacademy'
export const possibleVoidstones = [0, 1, 2, 3, 4]

export const preparedGlobals = globals

export const preparedCards = cards.map(card => {
  return {
    ...card,
    art: cardArtBase + card.art + '.png'
  }
})

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

export const preparedMaps = maps.map(map => {
  const mapTags = []
  pushTag(map.info, mapTags, map.layout, 'few_obstacles', 'few obstacles')
  pushTag(map.info, mapTags, map.layout, 'outdoors')
  pushTag(map.info, mapTags, map.layout, 'linear')
  pushTag(map.info, mapTags, map.layout, 'league_mechanics', 'league mechanics')
  pushTag(map.info, mapTags, map.layout, 'delirium_mirror', 'delirium mirror')

  pushTag(map.info, mapTags, map.boss, 'separated', 'boss separated')
  pushTag(map.info, mapTags, map.boss, 'not_spawned', 'boss not spawned')
  pushTag(map.info, mapTags, map.boss, 'rushable', 'boss rushable')
  pushTag(map.info, mapTags, map.boss, 'phases', 'boss with phases')
  pushTag(map.info, mapTags, map.boss, 'soft_phases', 'boss with soft phases')
  pushTag(map.info, mapTags, map.boss, 'not_twinnable', 'boss not twinnable')

  pushTag(map.info, mapTags, map, 'unique')
  pushTag(map.info, mapTags, map, 'pantheon')

  const cards = []
  for (let card of preparedCards) {
    if (!card.drop) {
        continue
    }

    if (card.drop.all_areas) {
      cards.push({ ...card })
    }

    if (card.drop.areas.includes(map.id)) {
      cards.push({ ...card })
    }

    if (map.boss.ids && map.boss.ids.some(id => card.drop.monsters.includes(id))) {
      cards.push({ ...card, boss: true })
    }
  }

  const mapWeight = cards
    .filter(c => !c.boss)
    .map(c => c.weight)
    .reduce((a, b) => a + b, 0)
  const bossWeight = cards.map(c => c.weight).reduce((a, b) => a + b, 0)

  for (let card of cards) {
    card.mapWeight = preparedGlobals['droppool_weight'] + (card.boss ? bossWeight : mapWeight)
    card.kiracWeight = bossWeight
  }

  if (map.boss.names) {
    const names = map.boss.names.filter(n => !n.includes('Merveil'))
    if (names.length > 1) {
      mapTags.push({ name: `${names.length} bosses` })
    }
  }

  const tier = mapLevelToTier(map.level)

  const out = {
    ...map,
    image: map.image
      ? '/img/layout/' +
        map.name
          .replace(' Map', '')
          .toLowerCase()
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .replaceAll(' ', '_') +
        '.png'
      : null,
    name: map.name.replace(' Map', ''),
    connected: (map.connected || []).map(c => c.replace(' Map', '')),
    cards: cards,
    tags: mapTags.sort((a, b) => a.name.localeCompare(b.name)),
    icon: mapIconBase + map.icon + '.png',
    wiki: wikiBase + map.name.replace(' ', '_'),
    tiers: [tier, Math.min(tier + 3, 16), Math.min(tier + 7, 16), Math.min(tier + 11, 16), Math.min(tier + 15, 16)]
  }

  // Build search index
  out.search = [
    ...new Set([
      out.name,
      ...out.connected,
      ...out.cards.map(c => c.name),
      ...out.cards.map(c => c.reward).filter(c => !!c),
      ...out.tags.map(t => t.name)
    ])
  ].map(v => v.trim().toLowerCase())
  return out
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
