import {
  defaultCardBaseline,
  preparedCards,
  preparedGlobals,
  preparedMaps,
  preparedMonsters,
  preparedTags
} from './data/index.js'
import { calculateScore, filter, parseValue } from './common.js'
import { atom } from 'jotai'
import { RESET } from 'jotai/utils'

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
  voidstones
) {
  let cardWeightBaseline = preparedCards.find(c => c.name === cardBaseline).weight
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
      const mapLevel = map.atlas ? map.levels[voidstones] : map.levels[map.levels.length - 1]
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
          card.totalWeight = preparedGlobals.droppool_weight + (card.boss ? bossWeight : mapWeight)
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

  // Now finally calculate overall map score
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

  return rated.sort((a, b) => b.score - a.score)
}

function rateCards(foundMaps, foundCards, foundMonsters, cardMinPriceInput, cardPriceSourceInput, cardDisplayInput) {
  return calculateScore(
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
  )
    .filter(card => card.price >= cardMinPriceInput || cardDisplayInput === 'all' || cardDisplayInput === 'drop')
    .sort((a, b) => b.score - a.score)
}

const storedAtom = (name, def, data) => {
  const getInitialValue = () => {
    if (data[name]) {
      return parseValue(data[name])
    }

    try {
      const item = localStorage.getItem(name)
      return item && item !== '' ? parseValue(JSON.parse(item), def) : def
    } catch (e) {
      console.warn(e)
      return def
    }
  }

  const baseAtom = atom(getInitialValue())
  return atom(
    get => get(baseAtom),
    (get, set, e) => {
      let val = e === RESET ? def : e && e.target ? e.target.value : e
      val = val === '' ? def : parseValue(val, def)
      set(baseAtom, val)
      try {
        localStorage.setItem(name, JSON.stringify(val))
        data[name] = val
      } catch (e) {
        console.warn(e)
      }
    }
  )
}

function createState() {
  let data = {}
  let dataEnabled = false
  if (window.location.hash && dataEnabled) {
    try {
      data = JSON.parse(atob(window.location.hash.replace('#', ''))) || {}
    } catch (e) {
      window.location.hash = ''
      data = {}
    }
  }

  const maps = atom(preparedMaps)
  const tags = atom(preparedTags)
  const cards = atom(preparedCards)
  const monsters = atom(preparedMonsters)
  const globals = atom(preparedGlobals)

  const input = {
    search: storedAtom('searchInput', '', data),

    voidstones: storedAtom('voidstonesInput', 0, data),
    cardDisplay: storedAtom('cardDisplayInput', 'drop', data),
    mapDisplay: storedAtom('mapDisplayInput', 'atlas+unique+special', data),

    layout: storedAtom('layoutInput', 3, data),
    density: storedAtom('densityInput', 2, data),
    boss: storedAtom('bossInput', 1, data),
    card: storedAtom('cardInput', 2, data),
    cardBaseline: storedAtom('cardBaselineInput', defaultCardBaseline, data),
    cardBaselineNumber: storedAtom('cardBaselineNumberInput', 1, data),
    cardMinPrice: storedAtom('cardMinPriceInput', 10, data),
    cardPriceSource: storedAtom('cardPriceSourceInput', 'league', data),
    cardValueSource: storedAtom('cardValueSourceInput', 'map', data),

    atlasScore: storedAtom('atlasScore', false, data),
    atlasIcons: storedAtom('atlasIcons', true, data),
    atlasLabels: storedAtom('atlasLabels', true, data)
  }

  const parsedSearch = atom(
    get => parseSearch(get(input.search) || ''),
    (get, set, e) => {
      const { v, neg, remove } = e
      let s = parseSearch(get(input.search) || '')
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
      get(input.voidstones)
    )
  )

  const filteredMaps = atom(get => filterValues(get(ratedMaps), get(parsedSearch)))

  const mapRegex = atom(get => buildRegex(get(filteredMaps)))

  const ratedCards = atom(get =>
    rateCards(
      get(ratedMaps),
      get(cards),
      get(monsters),
      get(input.cardMinPrice),
      get(input.cardPriceSource),
      get(input.cardDisplay)
    )
  )

  const filteredCards = atom(get => filterValues(get(ratedCards), get(parsedSearch)))

  return {
    maps,
    tags,
    cards,
    monsters,
    globals,
    input,
    parsedSearch,
    mapRegex,
    ratedMaps,
    filteredMaps,
    ratedCards,
    filteredCards
  }
}

export default createState()
