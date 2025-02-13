import { atom, useAtomValue } from 'jotai'

import state from '../state'
import MapFilterInput from './MapFilterInput'
import Tags from './Tags'

const filterInputs = atom(get => [
  {
    main: true,
    name: 'Search',
    placeholder: 'Search for map, tag, card, card reward, comma separated',
    tooltip: '',
    type: 'search',
    def: state.input.search,
    numberDef: atom('')
  },
  {
    main: true,
    name: 'Sort',
    tooltip: '',
    type: 'multiselect',
    options: [
      {
        label: 'Name',
        value: 'name'
      },
      {
        label: 'Score',
        value: 'score'
      },
      {
        label: 'Layout',
        value: 'layout'
      },
      {
        label: 'Density',
        value: 'density'
      },
      {
        label: 'Boss',
        value: 'boss'
      },
      {
        label: 'Card',
        value: 'card'
      }
    ],
    def: state.input.sort,
    numberDef: atom('')
  },
  {
    name: 'Layout weight',
    tooltip: (
      <>
        The weight of layout rating when calculating score for map (so end result is map layout * layout weight).
        <br />
        <b>This is not minimal layout rating filter</b>, this will simply push maps with good layouts lower or higher in
        list.
      </>
    ),
    type: 'number',
    def: state.input.layout,
    numberDef: atom('')
  },
  {
    name: 'Density weight',
    tooltip: (
      <>
        The weight of density rating when calculating score for map (so end result is map density * density weight).
        <br />
        <b>This is not minimal density rating filter</b>, this will simply push maps with good density lower or higher
        in list.
      </>
    ),
    type: 'number',
    def: state.input.density,
    numberDef: atom('')
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
    def: state.input.boss,
    numberDef: atom('')
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
    def: state.input.card,
    numberDef: atom('')
  },
  {
    name: 'Atlas voidstones',
    tooltip: <>How many voidstones you have. Used for marking cards as droppable or not and determining map tiers.</>,
    type: 'select',
    options: {
      0: '0 voidstones',
      1: '1 voidstone',
      2: '2 voidstones',
      3: '3 voidstones',
      4: '4 voidstones'
    },
    def: state.input.voidstones,
    numberDef: atom('')
  },
  {
    name: 'Map Tier',
    tooltip: <>Map tier range used to filter. Depends on voidstones you have.</>,
    type: 'search',
    def: state.input.mapTiers,
    numberDef: atom('')
  },
  {
    name: 'Card price source',
    tooltip: <>Source of price data, can be either League or Standard.</>,
    type: 'select',
    options: {
      league: 'League',
      standard: 'Standard'
    },
    def: state.input.cardPriceSource,
    numberDef: atom('')
  },
  {
    name: 'Card value source',
    tooltip: <>How card value is calculated, either based on card map drops or card value from kirac missions.</>,
    type: 'select',
    options: {
      map: 'Map drops',
      kirac: 'Kirac missions'
    },
    def: state.input.cardValueSource,
    numberDef: atom('')
  },
  {
    name: 'Minimum card price',
    tooltip: (
      <>
        Minimum price for the card to be considered as something that should be accounted for calculating map score and
        per map value.
        <br />
        Try to not go under <b>6c</b> as <b>poe.ninja</b> tends to overvalue the low cost cards by a lot even though
        when you click on listings the data say something else.
      </>
    ),
    type: 'number',
    def: state.input.cardMinPrice,
    numberDef: atom('')
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
        You should set this value to your observed drop rate of index card (for example Union in Cemetery) so the site
        can predict drop rates for your current farming strategy.
      </>
    ),
    type: 'cardselect',
    options: get(state.cards)
      .filter(c => c.weight)
      .sort((a, b) => b.weight - a.weight)
      .map(c => ({ label: c.name + ' (' + c.weight + ')', value: c.name })),
    def: state.input.cardBaseline,
    numberDef: state.input.cardBaselineNumber,
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
    def: state.input.cardDisplay,
    numberDef: atom('')
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
        <b>Atlas+Unique+Special maps:</b>
        <br />
        All maps on atlas and all unique and special map areas (that arent necessarily on atlas but are in game)
        <br />
        <b>All maps:</b>
        <br />
        All maps and areas including atlas maps that are not on atlas
        <br />
        <b>Atlas+Unique+Special+Act areas:</b>
        <br />
        Atlas+Unique+Special maps and act areas (for example <b>Blood Aqueduct</b>)
        <br />
        <b>All areas:</b>
        <br />
        Atlas+Unique+Special+Act areas and atlas maps that are currently not on atlas.
      </>
    ),
    type: 'select',
    options: {
      atlas: 'Atlas maps',
      'atlas+unique+special': 'Atlas+Unique+Special maps',
      allmaps: 'All maps',
      'atlas+unique+special+act': 'Atlas+Unique+Special+Act areas',
      all: 'All areas'
    },
    def: state.input.mapDisplay,
    numberDef: atom('')
  },
  {
    name: 'PoE Regex',
    tooltip: (
      <>
        Generates string that can be copy/pasted to Path of Exile search boxes that will search for the filtered maps.
        PoE search fields are limited to 50 characters so the string is truncated to fit the top maps based off search
        criteria.
      </>
    ),
    type: 'copytext',
    def: state.mapRegex,
    numberDef: atom(''),
    size: 'full'
  },
  {
    name: 'Shareable link',
    tooltip: <>Link that contains current filter configuration that can be shared with other people.</>,
    type: 'copytext',
    def: atom(''),
    numberDef: atom(''),
    size: 'big',
    hidden: true
  }
])

const MapFilter = ({ sidebar }) => {
  const inputs = useAtomValue(filterInputs)
  const tags = useAtomValue(state.tags)

  let searchClass = ''
  let inputSectionClass = ''
  let inputClass = ''
  let bigInputClass = ''
  let fullInputClass = ''

  if (sidebar) {
    inputClass = 'col-lg-12 col-md-6 col-12 p-1'
    bigInputClass = inputClass
    fullInputClass = inputClass
  } else {
    searchClass = 'col-lg-4 col-12'
    inputSectionClass = 'col col-lg-8 col-12'
    inputClass = 'col-lg-3 col-md-6 col-12 p-1'
    bigInputClass = 'col-lg-6 col-md-6 col-12 p-1'
    fullInputClass = 'col-lg-12 col-md-6 col-12 p-1'
  }

  return (
    <>
      <div className={searchClass}>
        {inputs
          .filter(i => i.main)
          .map(input => (
            <MapFilterInput key={input.name} input={input} inputClass="col-12 p-1" />
          ))}
        <div className="col-12 p-1">
          <span className="small">tags:</span>
          <Tags tags={tags} />
        </div>
      </div>
      <div className={inputSectionClass}>
        <div className="row g-0">
          {inputs
            .filter(i => !i.main)
            .map(input => (
              <MapFilterInput
                key={input.name}
                input={input}
                inputClass={inputClass}
                bigInputClass={bigInputClass}
                fullInputClass={fullInputClass}
              />
            ))}
        </div>
      </div>
    </>
  )
}
export default MapFilter
