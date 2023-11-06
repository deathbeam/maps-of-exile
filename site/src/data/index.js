import cards from './cards.json'
import maps from './maps.json'
import globals from './globals.json'
import monsters from './monsters.json'

export const wikiBase = 'https://www.poewiki.net/wiki/'
export const divcordDiscord = 'https://discord.gg/jsN2gsDUyM'
export const mapIconBase = 'https://web.poecdn.com/image/'
export const cardArtBase = 'https://web.poecdn.com/image/divination-card/'
export const defaultCardBaseline = 'The Chains that Bind'
export const githubRepo = 'https://github.com/deathbeam/maps-of-exile'
export const issueTemplate = `${githubRepo}/issues/new?labels=map-data&template=map_data.yml&title=Enter+map+name+here`
export const mfAcademyInvite = 'https://discord.gg/mfacademy'

export const preparedMonsters = monsters
export const preparedGlobals = globals
const lastUpdate = new Date(preparedGlobals.lastUpdate)
preparedGlobals.lastUpdate = lastUpdate.toLocaleString()

export const preparedCards = cards.map(card => {
  return {
    ...card,
    art: `${cardArtBase + card.art}.png`
  }
})

function pushTag(info, destination, source, key, name = null, color = null) {
  const tag = source[key]

  if (tag) {
    const val = typeof tag == 'boolean' ? name || key.replaceAll('_', ' ') : tag.toLowerCase()
    const out = {
      name: val,
      color
    }
    if (info && info[key]) {
      out.info = info[key]
    }
    destination.push(out)
  }
}

export const preparedMaps = maps.map(map => {
  const mapTags = []
  pushTag(map.info, mapTags, map, 'type', null, 'info')
  pushTag(map.info, mapTags, map, 'atlas', null, 'info')
  pushTag(map.info, mapTags, map, 'pantheon', null, 'warning')

  for (let key of Object.keys(map.tags)) {
    pushTag(map.info, mapTags, map.tags, key)
  }

  const cards = []
  for (let card of preparedCards) {
    if (!card.drop) {
      continue
    }

    if (card.drop.all_areas) {
      cards.push({ ...card })
    }

    if (map.ids.some(id => card.drop.areas.includes(id))) {
      cards.push({ ...card })
    }

    if (map.boss_ids && map.boss_ids.some(id => card.drop.monsters.includes(id))) {
      cards.push({ ...card, boss: true })
    }
  }

  if (map.boss_ids) {
    const names = [...new Set(map.boss_ids.map(b => preparedMonsters[b]).filter(b => !!b))]
      .filter(n => !n.includes('Merveil'))
      .sort()
    if (names.length > 1) {
      mapTags.push({ name: `${names.length} bosses` })
    }
  }

  const out = {
    ...map,
    image: map.image
      ? `/img/layout/${map.name
          .replace(' Map', '')
          .toLowerCase()
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .replaceAll(' ', '_')}.png`
      : null,
    name: map.name.replace(' Map', ''),
    connected: (map.connected || [])
      .map(c => c.replace(' Map', ''))
      .map(c => {
        const foundMap = maps.find(m => m.ids.includes(c))
        return foundMap ? foundMap.name : c
      }),
    cards,
    tags: mapTags.sort((a, b) => a.name.localeCompare(b.name)),
    icon: map.icon && (map.icon.startsWith('https') ? map.icon : `${mapIconBase + map.icon}.png`)
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
    name: t.name.replace(/\d+ bosses/, 'bosses').replace(/soul of .+/, 'soul of'),
    color: t.color
  }))
  .sort((a, b) => a.name.localeCompare(b.name))) {
  if (!preparedTagsMap.has(item.name)) {
    preparedTagsMap.set(item.name, true)
    preparedTags.push({
      name: item.name,
      color: item.color
    })
  }
}
