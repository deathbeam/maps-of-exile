import { computed, effect, signal } from '@preact/signals'
import { defaultCardBaseline, preparedCards, preparedGlobals, preparedMaps, preparedMonsters } from './data/index.js'
import { calculateScore, filter, parseValue } from './common.js'
import { createContext } from 'react'
import debounce from 'lodash.debounce'

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

const loading = signal(false)
function storedSignal(name, def) {
  const s = signal(
    (() => {
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
    })()
  )

  const deb = debounce(v => {
    s.value = v
    loading.value = false
  }, 300)

  s.reset = () => {
    loading.value = true
    deb(def)
  }

  s.change = e => {
    loading.value = true
    deb(e && e.target ? e.target.value : e)
  }

  effect(() => {
    localStorage.setItem(name, JSON.stringify(s.value))
    data[name] = s.value
  })

  return s
}

function createState() {
  const maps = signal(preparedMaps)
  const cards = signal(preparedCards)
  const monsters = signal(preparedMonsters)

  const input = {
    search: storedSignal('searchInput', ''),

    voidstones: storedSignal('voidstonesInput', 0),
    cardDisplay: storedSignal('cardDisplayInput', 'drop'),
    mapDisplay: storedSignal('mapDisplayInput', 'atlas+unique+special'),

    layout: storedSignal('layoutInput', 3),
    density: storedSignal('densityInput', 2),
    boss: storedSignal('bossInput', 1),
    card: storedSignal('cardInput', 2),
    cardBaseline: storedSignal('cardBaselineInput', defaultCardBaseline),
    cardBaselineNumber: storedSignal('cardBaselineNumberInput', 1),
    cardMinPrice: storedSignal('cardMinPriceInput', 10),
    cardPriceSource: storedSignal('cardPriceSourceInput', 'league'),
    cardValueSource: storedSignal('cardValueSourceInput', 'map'),

    atlasScore: storedSignal('atlasScore', false),
    atlasIcons: storedSignal('atlasIcons', true),
    atlasLabels: storedSignal('atlasLabels', true)
  }

  const parsedSearch = computed(() => parseSearch(input.search.value))

  const ratedMaps = computed(() =>
    rateMaps(
      maps.value,
      cards.value,
      input.layout.value,
      input.density.value,
      input.boss.value,
      input.card.value,
      input.cardBaseline.value,
      input.cardBaselineNumber.value,
      input.cardMinPrice.value,
      input.cardPriceSource.value,
      input.cardValueSource.value,
      input.cardDisplay.value,
      input.mapDisplay.value,
      input.voidstones.value
    )
  )

  const filteredMaps = computed(() => filterValues(ratedMaps.value, parsedSearch.value))

  const mapRegex = computed(() => buildRegex(filteredMaps.value))

  const ratedCards = computed(() =>
    rateCards(
      ratedMaps.value,
      cards.value,
      monsters.value,
      input.cardMinPrice.value,
      input.cardPriceSource.value,
      input.cardDisplay.value
    )
  )

  const filteredCards = computed(() => filterValues(ratedCards.value, parsedSearch.value))

  const updateSearch = (v, neg, remove) => {
    let s = parseSearch(input.search.value || '')
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

    input.search.value = buildSearch(s)
  }

  return {
    loading,
    input,
    updateSearch,
    parsedSearch,
    mapRegex,
    ratedMaps,
    filteredMaps,
    ratedCards,
    filteredCards
  }
}

export const AppState = createContext()
export default createState
