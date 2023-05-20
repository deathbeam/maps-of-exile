import cards from './cards.json'
import maps from './maps.json'

export const defaultCardBaseline = 'The Chains that Bind'
export const preparedCards = cards
export const githubRepo = 'https://github.com/deathbeam/maps-of-exile'
export const issueTemplate = `${githubRepo}/issues/new?labels=map-data&template=map_data.yml&title=Enter+map+name+here`

export const preparedMaps = maps.map(map => {
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

  if (map.boss.names) {
    const names = map.boss.names.filter(n => !n.includes('Merveil'))
    if (names.length > 1) {
      mapTags.push({ name: `${names.length} bosses` })
    }
  }

  const out = {
    ...map,
    name: map.name.replace(' Map', ''),
    connected: (map.connected || []).map(c => c.replace(' Map', '')),
    tags: mapTags.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Build search index
  out.search = [out.name, ...out.connected, ...out.cards, ...(out.boss.cards || []), ...out.tags.map(t => t.name)].map(
    v => v.trim().toLowerCase()
  )

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
