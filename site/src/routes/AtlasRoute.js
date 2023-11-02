import { ReactFlowProvider } from 'reactflow'
import Atlas from '../components/atlas/Atlas'
import MapFilter from '../components/MapFilter'
import Navbar from '../components/Navbar'
import { useMemo } from 'react'
import Map from '../components/atlas/Map'
import { useParams } from 'react-router-dom'

const AtlasRoute = ({
  ratedMaps,
  inputs,
  addToInput,
  currentSearch,
  searchInput,
  searchRef,
  setSearchInput,
  voidstonesInput,
  cardValueSourceInput
}) => {
  const { currentMap } = useParams()
  const selectedMap = useMemo(() => currentMap && ratedMaps.find(m => m.name === currentMap), [currentMap, ratedMaps])
  const style = currentMap && {
    backgroundImage:
      'linear-gradient(rgba(33, 37, 41, 0.7), rgba(33, 37, 41, 0.7)), url(' + (selectedMap.image || '') + ')',
    backgroundSize: 'cover'
  }

  return (
    <div className="row g-0 overflow-visible position-relative">
      <div className="col-lg-9 col-12">
        <ReactFlowProvider>
          <Atlas maps={ratedMaps} currentSearch={currentSearch} currentMap={currentMap} voidstones={voidstonesInput} />
        </ReactFlowProvider>
      </div>
      <div className="container-fluid col-lg-3 col-12 full-height m-0 p-0 overflow-visible" style={style}>
        <Navbar close={!!currentMap && '/atlas'} />
        <div className="m-2">
          <p className="d-block d-lg-none">
            <b className="text-danger">Warning!</b> <b>Atlas</b> view is unsupported on small resolutions, switch back
            to <b>List</b> view.
          </p>
          {currentMap ? (
            <Map map={selectedMap} voidstones={voidstonesInput} cardValueSourceInput={cardValueSourceInput} />
          ) : (
            <MapFilter
              inputs={inputs}
              sidebar={true}
              addToInput={addToInput}
              currentSearch={currentSearch}
              searchInput={searchInput}
              searchRef={searchRef}
              setSearchInput={setSearchInput}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AtlasRoute
