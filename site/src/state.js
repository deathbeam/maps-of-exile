import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'

import atomWithHash from './atoms/atomWithHash'
import atomWithStore from './atoms/atomWithStore'
import { calculateScore, filter, filterTiers } from './common'
import { cardArtBase, defaultCardBaseline, globals, mapIconBase, wikiBase } from './constants'

function pushTag(info, destination, source, key, name = null, color = null) {
  const tag = source[key]

  if (tag) {
    const val = typeof tag == 'boolean' ? name || key.replaceAll('_', ' ') : tag.toLowerCase()
    const out = {
      name: val,
      color: color || 'secondary'
    }
    if (info && info[key]) {
      out.info = info[key]
    }
    destination.push(out)
  }
}

async function prepareMonsters() {
  return (await import('./data/monsters.json')).default
}

async function prepareCards() {
  const cards = (await import('./data/cards.json')).default
  return cards.map(card => {
    return {
      ...card,
      art: cardArtBase + card.art + '.png'
    }
  })
}

async function prepareMaps(preparedMonsters, preparedCards) {
  const maps = (await import('./data/maps.json')).default

  return maps.map(map => {
    let icon = map.icon
    if (map.type === 'act area') {
      icon = '/img/act.webp'
    } else if (map.name.startsWith('Trial of ')) {
      icon = '/img/labyrinth.webp'
    } else if (map.icon && !map.icon.startsWith('/img')) {
      icon = mapIconBase + map.icon + '.png'
    }

    const mapTags = []
    pushTag(map.info, mapTags, map, 'type', null, 'info')
    pushTag(map.info, mapTags, map, 'atlas', null, 'info')
    pushTag(map.info, mapTags, map, 'pantheon', null, 'warning')

    for (let key of Object.keys(map.tags)) {
      const color = key.endsWith('_map') ? 'primary' : null
      pushTag(map.info, mapTags, map.tags, key, null, color)
    }

    if (import.meta.env.DEV) {
      if (!map.image) {
        mapTags.push({
          name: 'missing image',
          color: 'danger'
        })
      }

      if (!icon) {
        mapTags.push({
          name: 'missing icon',
          color: 'danger'
        })
      }
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

    let names = []

    if (map.boss_ids) {
      names = [...new Set(map.boss_ids.map(b => preparedMonsters[b]).filter(b => !!b))].sort()
      const namesFiltered = names.filter(n => !n.includes('Merveil'))
      if (namesFiltered.length > 1) {
        mapTags.push({ name: `${namesFiltered.length} bosses`, color: 'warning' })
      }
    }

    const out = {
      ...map,
      boss_names: names,
      name: map.name.replace(' Map', ''),
      icon: icon,
      wiki: wikiBase + map.name.replaceAll(' ', '_'),
      connected: (map.connected || [])
        .map(c => c.replace(' Map', ''))
        .map(c => {
          const foundMap = maps.find(m => m.ids.includes(c))
          return foundMap ? foundMap.name : c
        }),
      cards: cards,
      tags: mapTags
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => {
          if (a.color === 'secondary') {
            return 1
          }
          if (b.color === 'secondary') {
            return -1
          }
          return a.color.localeCompare(b.color)
        })
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
}

async function prepareTags(preparedMaps) {
  const preparedTags = []
  const preparedTagsMap = new Map()
  for (const item of preparedMaps
    .flatMap(m => m.tags)
    .map(t => ({
      name: t.name.replace(/\d+ bosses/, 'bosses').replace(/soul of .+/, 'soul of'),
      color: t.color
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .sort((a, b) => {
      if (a.color === 'secondary') {
        return 1
      }
      if (b.color === 'secondary') {
        return -1
      }
      return a.color.localeCompare(b.color)
    })) {
    if (!preparedTagsMap.has(item.name)) {
      preparedTagsMap.set(item.name, true)
      preparedTags.push({
        name: item.name,
        color: item.color
      })
    }
  }
  return preparedTags
}

function parseSearch(s) {
  return (s || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e)
    .map(e => ({
      value: e.replace(/[+-]/g, ''),
      neg: e.startsWith('-')
    }))
}

function buildSearch(s) {
  return s.map(v => (v.neg ? '-' : '') + v.value).join(', ')
}

function buildRegex(maps) {
  const re = `"${[...new Set(maps.map(m => m.shorthand))].join('|')}"`
  if (re.length > 50) {
    let splitMaps = re.substring(0, 49).split('|')
    return `${splitMaps.splice(0, splitMaps.length - 1).join('|')}"`
  }
  return re
}

function filterValues(values, currentSearch) {
  return values
    .filter(v => !currentSearch || filter(currentSearch, v.search))
    .sort(
      (a, b) =>
        Number(filter(currentSearch, b.name.toLowerCase())) - Number(filter(currentSearch, a.name.toLowerCase()))
    )
}

function filterMaps(values, currentSearch, voidstoneCount, mapTiers) {
  return values
    .filter(v => !currentSearch || filter(currentSearch, v.search))
    .filter(v => !mapTiers || mapTiers === '1-16' || filterTiers(v.levels, voidstoneCount, mapTiers))
    .sort(
      (a, b) =>
        Number(filter(currentSearch, b.name.toLowerCase())) - Number(filter(currentSearch, a.name.toLowerCase()))
    )
}

function calcRate(mapRate, price, stack) {
  let perMap = 1
  let everyMap = 1 / mapRate
  if (everyMap < 1) {
    perMap = Math.floor(Math.round((1 / everyMap) * 100) / 100)
    everyMap = 1
  } else {
    everyMap = Math.ceil(Math.round(everyMap * 100) / 100)
  }

  return {
    perMap: perMap * stack,
    everyMap,
    value: Math.round(price * mapRate * stack * 1000) / 1000
  }
}

function sortBy(sorts, values) {
  function extractKey(sort, v) {
    if (sort !== 'name' && sort !== 'score') {
      if (!v.sort) {
        return null
      }

      return v.sort[sort]
    } else {
      return v[sort]
    }
  }

  for (let sort of sorts) {
    values = values.sort((a, b) => {
      a = extractKey(sort, a)
      b = extractKey(sort, b)

      if (a == b) {
        return 0
      }

      if (!a) {
        return 1
      }

      if (!b) {
        return -1
      }

      if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b)
      }

      return b - a
    })
  }

  return values
}

function rateMaps(
  foundMaps,
  foundCards,
  layoutInput,
  densityInput,
  bossInput,
  cardInput,
  cardBaseline,
  cardBaselineNumber,
  cardMinPrice,
  cardPriceSource,
  cardValueSource,
  cardDisplay,
  mapDisplay,
  voidstones,
  sort
) {
  let cardWeightBaseline = (foundCards.find(c => c.name === cardBaseline) || 0).weight
  if (cardBaselineNumber > 0) {
    cardWeightBaseline /= cardBaselineNumber
  } else if (cardBaselineNumber < 0) {
    cardWeightBaseline *= Math.abs(cardBaselineNumber)
  }

  // First calculate value for cards
  const mapsWithCardValues = foundMaps
    .filter(m => {
      switch (mapDisplay) {
        case 'atlas+unique+special+act':
          return m.atlas || m.type === 'unique map' || m.type === 'special map' || m.type === 'act area'
        case 'atlas+unique+special':
          return m.atlas || m.type === 'unique map' || m.type === 'special map'
        case 'atlas':
          return m.atlas
        case 'allmaps':
          return m.type.includes('map')
        default:
          return true
      }
    })
    .map(map => {
      const mapLevel = map.atlas || map.type == 'map' ? map.levels[voidstones] : map.levels[map.levels.length - 1]
      const mapCards = []
      let mapWeight = 0
      let bossWeight = 0

      for (let card of map.cards) {
        const cardMinLevel = (card.drop || {}).min_level || 0
        const cardMaxLevel = (card.drop || {}).max_level || 99
        const dropEligible = mapLevel >= cardMinLevel && mapLevel <= cardMaxLevel
        const weight = dropEligible ? card.weight || 0 : 0
        const price = (cardPriceSource === 'standard' ? card.standardPrice : card.price) || 0
        const priceEligible = price >= cardMinPrice
        const unknown = !card.weight

        bossWeight += weight
        if (!card.boss) {
          mapWeight += weight
        }

        if (!unknown) {
          if (
            (cardDisplay === 'high+drop' && (!dropEligible || !priceEligible)) ||
            (cardDisplay === 'high' && !priceEligible) ||
            (cardDisplay === 'drop' && !dropEligible)
          ) {
            continue
          }
        }

        mapCards.push({
          ...card,
          price,
          weight,
          unknown
        })
      }

      for (let card of mapCards) {
        if (cardValueSource === 'kirac') {
          card.source = 'kirac mission'
          card.totalWeight = bossWeight
          card.dropPoolItems = 1
          const rate = card.weight / card.totalWeight
          card.value = map.type !== 'map' ? 0 : card.stack * card.price * rate
          card.rate = map.type === 'map' && calcRate(rate, card.price, card.stack)
        } else {
          card.source = 'map'
          card.totalWeight = globals.droppool_weight + (card.boss ? bossWeight : mapWeight)
          card.dropPoolItems = 1 / (cardWeightBaseline / card.totalWeight) / (card.boss ? 10 : 1)
          const rate = (card.weight / card.totalWeight) * card.dropPoolItems
          card.value = card.price * rate
          card.rate = calcRate(rate, card.price, 1)
        }

        if (card.price < cardMinPrice) {
          card.value = 0
        }
      }

      return {
        ...map,
        cards: mapCards.sort((a, b) => b.price - a.price).sort((a, b) => b.value - a.value)
      }
    })

  // Now calculate score for each card
  calculateScore(
    mapsWithCardValues.flatMap(m => m.cards),
    100
  )

  // Now finally calculate overall map score and sorts
  const rated = calculateScore(
    mapsWithCardValues.map(map => {
      const layoutValue = (map.rating.layout || 0) * layoutInput
      const densityValue = (map.rating.density || 0) * densityInput
      const bossValue = (map.rating.boss || 0) * bossInput
      let cardValue = 0

      for (let card of map.cards) {
        cardValue += (card.score / 10) * cardInput
      }

      map.value = layoutValue + densityValue + bossValue + cardValue
      map.sort = {
        layout: layoutValue,
        density: densityValue,
        boss: bossValue,
        card: cardValue
      }

      return map
    }),
    100
  )

  // Now find scores for connected maps
  for (let map of rated) {
    const connectedOut = []
    for (let connected of map.connected || []) {
      connectedOut.push({
        name: connected,
        score: (rated.find(rm => rm.name === connected) || {}).score || 0
      })
    }
    map.connected = connectedOut
  }

  return sortBy(sort, rated)
}

function rateCards(
  foundMaps,
  foundCards,
  foundMonsters,
  cardMinPriceInput,
  cardPriceSourceInput,
  cardDisplayInput,
  sort
) {
  return sortBy(
    sort,
    calculateScore(
      foundCards.map(c => {
        const price = (cardPriceSourceInput === 'standard' ? c.standardPrice : c.price) || 0
        const out = {
          ...c,
          drop: c.drop || {},
          maps: foundMaps
            .map(m => {
              const card = m.cards.find(mc => {
                if (mc.name !== c.name) {
                  return false
                }
                return mc.unknown || cardDisplayInput === 'all' || cardDisplayInput === 'high' || mc.weight > 0
              })

              if (!card) {
                return m
              }

              return {
                ...m,
                card
              }
            })
            .filter(m => m.card),
          unknown: !c.weight,
          price,
          value: price >= cardMinPriceInput ? price * (c.weight || 0) : 0
        }

        out.monsters = [...new Set((out.drop.monsters || []).map(m => foundMonsters[m] || m))].sort()
        out.boss = out.monsters.length > 0
        out.search = [
          ...new Set([
            out.name,
            out.reward,
            ...out.monsters,
            ...out.maps.map(c => c.name),
            ...out.maps.flatMap(c => c.tags).map(t => t.name)
          ])
        ].map(v => v.trim().toLowerCase())

        return out
      }),
      100
    ).filter(card => card.price >= cardMinPriceInput || cardDisplayInput === 'all' || cardDisplayInput === 'drop')
  )
}

function createState() {
  let data = null
  let dataEnabled = false
  if (window.location.hash && dataEnabled) {
    try {
      data = JSON.parse(atob(window.location.hash.replace('#', ''))) || {}
    } catch (e) {
      window.location.hash = ''
      data = {}
    }
  }

  const location = atomWithHash()

  const asyncMonsters = atom(prepareMonsters)
  const monsters = unwrap(asyncMonsters, prev => prev ?? [])

  const asyncCards = atom(prepareCards)
  const cards = unwrap(asyncCards, prev => prev ?? [])

  const asyncMaps = atom(async get => await prepareMaps(await get(asyncMonsters), await get(asyncCards)))
  const maps = unwrap(asyncMaps, prev => prev ?? [])

  const asyncTags = atom(async get => await prepareTags(await get(asyncMaps)))
  const tags = unwrap(asyncTags, prev => prev ?? [])

  const input = {
    search: atomWithStore('searchInput', '', data),
    mapTiers: atomWithStore('mapTiersInput', '', data),
    sort: atomWithStore('sortInput', ['score'], data),

    voidstones: atomWithStore('voidstonesInput', 0, data),
    cardDisplay: atomWithStore('cardDisplayInput', 'drop', data),
    mapDisplay: atomWithStore('mapDisplayInput', 'atlas+unique+special', data),

    layout: atomWithStore('layoutInput', 3, data),
    density: atomWithStore('densityInput', 2, data),
    boss: atomWithStore('bossInput', 1, data),
    card: atomWithStore('cardInput', 2, data),
    cardBaseline: atomWithStore('cardBaselineInput', defaultCardBaseline, data),
    cardBaselineNumber: atomWithStore('cardBaselineNumberInput', 1, data),
    cardMinPrice: atomWithStore('cardMinPriceInput', 10, data),
    cardPriceSource: atomWithStore('cardPriceSourceInput', 'league', data),
    cardValueSource: atomWithStore('cardValueSourceInput', 'map', data),

    atlasScore: atomWithStore('atlasScore', false, data),
    atlasIcons: atomWithStore('atlasIcons', true, data),
    atlasLabels: atomWithStore('atlasLabels', true, data)
  }

  const alerts = {
    cardPrices: atomWithStore('cardPricesAlert', true),
    newLeague: atomWithStore('newLeagueAlert' + globals.league, true)
  }

  const parsedSearch = atom(
    get => parseSearch(get(input.search)),
    (get, set, e) => {
      const { v, neg, remove } = e
      let s = parseSearch(get(input.search))
      if (remove) {
        s = s.filter(sv => sv.value !== v)
      } else {
        const sv = s.find(sv => sv.value === v)
        if (sv) {
          sv.neg = neg
        } else {
          s.push({ value: v, neg })
        }
      }

      set(input.search, buildSearch(s))
    }
  )

  const ratedMaps = atom(get =>
    rateMaps(
      get(maps),
      get(cards),
      get(input.layout),
      get(input.density),
      get(input.boss),
      get(input.card),
      get(input.cardBaseline),
      get(input.cardBaselineNumber),
      get(input.cardMinPrice),
      get(input.cardPriceSource),
      get(input.cardValueSource),
      get(input.cardDisplay),
      get(input.mapDisplay),
      get(input.voidstones),
      get(input.sort)
    )
  )

  const filteredMaps = atom(get => filterMaps(get(ratedMaps), get(parsedSearch), get(input.voidstones), get(input.mapTiers)))

  const mapRegex = atom(get => buildRegex(get(filteredMaps)))

  const ratedCards = atom(get =>
    rateCards(
      get(ratedMaps),
      get(cards),
      get(monsters),
      get(input.cardMinPrice),
      get(input.cardPriceSource),
      get(input.cardDisplay),
      get(input.sort)
    )
  )

  const filteredCards = atom(get => filterValues(get(ratedCards), get(parsedSearch)))

  return {
    location,
    maps,
    tags,
    cards,
    monsters,
    input,
    alerts,
    parsedSearch,
    mapRegex,
    ratedMaps,
    filteredMaps,
    ratedCards,
    filteredCards
  }
}

export default createState()
