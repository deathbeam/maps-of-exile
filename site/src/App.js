import 'bootstrap/dist/css/bootstrap.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './App.css'

import { useCallback, useMemo, useRef, useTransition } from 'react'
import { defaultCardBaseline, issueTemplate, preparedCards, preparedGlobals, preparedMaps } from './data'
import Loader from './components/Loader'
import { calculateScore, filter, mapTierToLevel } from './common'
import usePersistedState from './hooks/usePersistedState'
import useInputField from './hooks/useInputField'
import ListView from './views/ListView'
import AtlasView from './views/AtlasView'
import CardsView from './views/CardsView'

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
          return m.atlas || m.type === 'unique map' || m.type === 'special area' || m.type === 'act area'
        case 'atlas+unique+special':
          return m.atlas || m.type === 'unique map' || m.type === 'special area'
        case 'atlas+unique':
          return m.atlas || m.type === 'unique map'
        case 'atlas':
          return m.atlas
        case 'allmaps':
          return m.type.includes('map')
        default:
          return true
      }
    })
    .map(map => {
      const mapLevel = mapTierToLevel(map.tiers[voidstones])
      const mapCards = []
      let mapWeight = 0
      let bossWeight = 0

      for (let card of map.cards) {
        const cardMinLevel = (card.drop || {}).min_level || 0
        const cardMaxLevel = (card.drop || {}).max_level || 99
        const dropEligible = mapLevel >= cardMinLevel && mapLevel <= cardMaxLevel
        const weight = dropEligible ? card.weight || 0 : 0
        const price = (cardPriceSource === 'standard' ? card.standardPrice : card.price) || 0

        bossWeight += weight
        if (!card.boss) {
          mapWeight += weight
        }

        mapCards.push({
          ...card,
          price,
          weight,
          unknown: !card.weight
        })
      }

      for (let card of mapCards) {
        card.mapWeight = preparedGlobals.droppool_weight + (card.boss ? bossWeight : mapWeight)
        card.kiracWeight = bossWeight
        card.dropPoolItems = 1 / (cardWeightBaseline / card.mapWeight) / (card.boss ? 10 : 1)

        const dropEligible = card.weight > 0
        const priceEligible = card.price >= cardMinPrice
        if (!card.unknown) {
          if (
            (cardDisplay === 'high+drop' && (!dropEligible || !priceEligible)) ||
            (cardDisplay === 'high' && !priceEligible) ||
            (cardDisplay === 'drop' && !dropEligible)
          ) {
            card.hidden = true
            card.value = 0
            continue
          }
        }

        if (!priceEligible) {
          card.value = 0
          continue
        }

        if (cardValueSource === 'kirac') {
          card.value = map.type !== 'map' ? 0 : card.stack * card.price * (card.weight / card.kiracWeight)
        } else {
          card.value = card.price * (card.weight / card.mapWeight) * card.dropPoolItems
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
    10
  )

  // Now finally calculate overall map score
  const rated = calculateScore(
    mapsWithCardValues.map(map => {
      const layoutValue = (map.rating.layout || 0) * layoutInput
      const densityValue = (map.rating.density || 0) * densityInput
      const bossValue = (map.rating.boss || 0) * bossInput
      let cardValue = 0

      for (let card of map.cards) {
        cardValue += card.score * cardInput
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

function filterMaps(ratedMaps, currentSearch) {
  return ratedMaps
    .filter(m => !currentSearch || filter(currentSearch, m.search))
    .sort(
      (a, b) =>
        Number(filter(currentSearch, b.name.toLowerCase())) - Number(filter(currentSearch, a.name.toLowerCase()))
    )
}

function App() {
  const [isPending, startTransition] = useTransition()
  const shareableRef = useRef(null)
  const poeRegexRef = useRef(null)
  const searchRef = useRef(null)

  const [view, setView] = usePersistedState('view', 'list', startTransition)
  const voidstones = useInputField('voidstonesInput', 0, startTransition)
  const cardDisplay = useInputField('cardDisplayInput', 'all', startTransition)
  const mapDisplay = useInputField('mapDisplayInput', 'atlas', startTransition, shareableRef)

  const [searchInput, setSearchInput] = usePersistedState('searchInput', '', startTransition, shareableRef)
  const layout = useInputField('layoutInput', 3, startTransition, shareableRef)
  const density = useInputField('densityInput', 2, startTransition, shareableRef)
  const boss = useInputField('bossInput', 1, startTransition, shareableRef)
  const card = useInputField('cardWeightInput', 2, startTransition, shareableRef)
  const cardBaseline = useInputField('cardBaselineInput', defaultCardBaseline, startTransition, shareableRef)
  const cardBaselineNumber = useInputField('cardBaselineNumberInput', 1, startTransition, shareableRef)
  const cardMinPrice = useInputField('cardMinPriceInput', 10, startTransition, shareableRef)
  const cardPriceSource = useInputField('cardPriceSourceInput', 'league', startTransition, shareableRef)
  const cardValueSource = useInputField('cardValueSourceInput', 'map', startTransition, shareableRef)

  const ratedMaps = useMemo(
    () =>
      rateMaps(
        preparedMaps,
        preparedCards,
        layout.get,
        density.get,
        boss.get,
        card.get,
        cardBaseline.get,
        cardBaselineNumber.get,
        cardMinPrice.get,
        cardPriceSource.get,
        cardValueSource.get,
        cardDisplay.get,
        mapDisplay.get,
        voidstones.get
      ),
    [
      layout,
      density,
      boss,
      card,
      cardBaseline,
      cardBaselineNumber,
      cardMinPrice,
      cardPriceSource,
      cardValueSource,
      cardDisplay,
      mapDisplay,
      voidstones
    ]
  )
  const currentSearch = useMemo(() => parseSearch(searchInput), [searchInput])

  const filteredMaps = useMemo(() => filterMaps(ratedMaps, currentSearch), [ratedMaps, currentSearch])

  const poeRegex = useMemo(() => {
    const re = '"' + [...new Set(filteredMaps.map(m => m.shorthand))].join('|') + '"'
    if (re.length > 50) {
      let splitMaps = re.substring(0, 49).split('|')
      return splitMaps.splice(0, splitMaps.length - 1).join('|') + '"'
    }
    return re
  }, [filteredMaps])

  const addToInput = useCallback(
    (v, neg, remove) => {
      let curVal = searchRef.current ? searchRef.current.value : searchInput
      let s = parseSearch(curVal || '')

      if (remove) {
        s = s.filter(sv => sv.value !== v)
      } else {
        const sv = s.find(sv => sv.value === v)
        if (sv) {
          sv.neg = neg
        } else {
          s.push({ value: v, neg: neg })
        }
      }

      const val = buildSearch(s)
      if (searchRef.current) {
        searchRef.current.value = val
      }
      setSearchInput(val)
    },
    [searchInput, setSearchInput, searchRef]
  )

  const inputs = useMemo(
    () => [
      {
        name: 'Layout weight',
        tooltip: (
          <>
            The weight of layout rating when calculating score for map (so end result is map layout * layout weight).
            <br />
            <b>This is not minimal layout rating filter</b>, this will simply push maps with good layouts lower or
            higher in list.
          </>
        ),
        type: 'number',
        def: layout
      },
      {
        name: 'Density weight',
        tooltip: (
          <>
            The weight of density rating when calculating score for map (so end result is map density * density weight).
            <br />
            <b>This is not minimal density rating filter</b>, this will simply push maps with good density lower or
            higher in list.
          </>
        ),
        type: 'number',
        def: density
      },
      {
        name: 'Boss weight',
        tooltip: (
          <>
            The weight of boss rating when calculating score for map (so end result is map boss * boss weight).
            <br />
            <b>This is not minimal boss rating filter</b>, this will simply push maps with good boss lower or higher in
            list.
          </>
        ),
        type: 'number',
        def: boss
      },
      {
        name: 'Card weight',
        tooltip: (
          <>
            The weight of card rating when calculating score for map (so end result is map card rating * card weight).
            <br />
            <b>This is not minimal card weight filter</b>, this will simply push maps with good cards lower or higher in
            list.
          </>
        ),
        type: 'number',
        def: card
      },
      {
        name: 'Atlas voidstones',
        tooltip: (
          <>How many voidstones you have. Used for marking cards as droppable or not and determining map tiers.</>
        ),
        type: 'select',
        options: {
          0: '0 voidstones',
          1: '1 voidstone',
          2: '2 voidstones',
          3: '3 voidstones',
          4: '4 voidstones'
        },
        def: voidstones
      },
      {
        name: 'Card price source',
        tooltip: <>Source of price data, can be either League or Standard.</>,
        type: 'select',
        options: {
          league: 'League',
          standard: 'Standard'
        },
        def: cardPriceSource
      },
      {
        name: 'Card value source',
        tooltip: <>How card value is calculated, either based on card map drops or card value from kirac missions.</>,
        type: 'select',
        options: {
          map: 'Map drops',
          kirac: 'Kirac missions'
        },
        def: cardValueSource
      },
      {
        name: 'Minimum card price',
        tooltip: (
          <>
            Minimum price for the card to be considered as something that should be accounted for calculating map score
            and per map value.
            <br />
            Try to not go under <b>6c</b> as <b>poe.ninja</b> tends to overvalue the low cost cards by a lot even though
            when you click on listings the data say something else.
          </>
        ),
        type: 'number',
        def: cardMinPrice
      },
      {
        name: 'Average card per map',
        tooltip: (
          <>
            The baseline card drop you are expecting to see every map on average with number input next to it. Positive
            number indicates x cards dropped per map, negative number indicates card dropped every x maps.
            <br />
            This is used for calculating how many drop pool items you get on average and that is used for{' '}
            <b>calculating chance to get card per map</b>.
            <br />
            You should set this value to your observed drop rate of index card (for example Union in Cemetery) so the
            site can predict drop rates for your current farming strategy.
          </>
        ),
        type: 'cardselect',
        options: preparedCards
          .sort((a, b) => b.weight - a.weight)
          .map(c => ({ name: c.name + ' (' + c.weight + ')', value: c.name })),
        def: cardBaseline,
        numberDef: cardBaselineNumber,
        size: 'big'
      },
      {
        name: 'Card display',
        tooltip: <>Which cards are displayed/hidden.</>,
        type: 'select',
        options: {
          all: 'All cards',
          high: 'High value only',
          drop: 'Droppable only',
          'high+drop': 'High value and droppable only'
        },
        def: cardDisplay
      },
      {
        name: 'Map display',
        tooltip: (
          <>
            Which maps and aras are displayed.
            <br />
            <br />
            <b>Atlas maps:</b>
            <br />
            All maps on atlas
            <br />
            <b>Atlas+Unique maps:</b>
            <br />
            All maps on atlas and all unique map areas (that arent necessarily on atlas but are in game)
            <br />
            <b>All maps:</b>
            <br />
            All maps and unique map areas (including maps that are not on atlas, e.g from past leagues)
            <br />
            <b>Atlas+Unique+Special areas:</b>
            <br />
            Atlas+Unique maps and uncategorized special areas (for example <b>Abyssal Depths</b>)
            <br />
            <b>Atlas+Unique+Special+Act areas:</b>
            <br />
            Atlas+Unique+Special maps and areas and act areas (for example <b>Blood Aqueduct</b>)
            <br />
            <b>All areas:</b>
            <br />
            Atlas+Unique+Special+Act areas and atlas maps that are currently not on atlas.
          </>
        ),
        type: 'select',
        options: {
          atlas: 'Atlas maps',
          'atlas+unique': 'Atlas+Unique maps',
          allmaps: 'All maps',
          'atlas+unique+special': 'Atlas+Unique+Special areas',
          'atlas+unique+special+act': 'Atlas+Unique+Special+Act areas',
          all: 'All areas'
        },
        def: mapDisplay
      },
      {
        name: 'PoE Regex',
        tooltip: (
          <>
            Generates string that can be copy/pasted to Path of Exile search boxes that will search for the filtered
            maps. PoE search fields are limited to 50 characters so the string is truncated to fit the top maps based
            off search criteria.
          </>
        ),
        type: 'copytext',
        def: {
          ref: poeRegexRef,
          get: poeRegex
        },
        size: 'full'
      },
      {
        name: 'Shareable link',
        tooltip: <>Link that contains current filter configuration that can be shared with other people.</>,
        type: 'copytext',
        def: {
          ref: shareableRef
        },
        size: 'big',
        hidden: true
      }
    ],
    [
      layout,
      density,
      boss,
      card,
      cardBaseline,
      cardBaselineNumber,
      cardMinPrice,
      cardPriceSource,
      cardValueSource,
      cardDisplay,
      voidstones,
      mapDisplay,
      poeRegexRef,
      poeRegex,
      shareableRef
    ]
  )

  const CurrentView = useMemo(() => {
    switch (view) {
      case 'atlas':
        return AtlasView
      case 'cards':
        return CardsView
      case 'list':
      default:
        return ListView
    }
  }, [view])

  return (
    <>
      <Loader loading={isPending} />
      <a
        className="btn btn-primary position-fixed top-0 start-0 m-2 on-top"
        href={issueTemplate}
        target="_blank"
        rel="noreferrer"
      >
        <i className="fa-solid fa-fw fa-code-fork" /> Data incorrect or missing? Open an issue
      </a>
      <CurrentView
        view={view}
        setView={setView}
        inputs={inputs}
        ratedMaps={ratedMaps}
        filteredMaps={filteredMaps}
        addToInput={addToInput}
        currentSearch={currentSearch}
        searchRef={searchRef}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        voidstonesInput={voidstones.get}
        cardValueSourceInput={cardValueSource.get}
        cardMinPriceInput={cardMinPrice.get}
        cardPriceSourceInput={cardPriceSource.get}
      />
    </>
  )
}

export default App
