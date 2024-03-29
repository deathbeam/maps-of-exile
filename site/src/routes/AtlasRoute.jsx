import { atom, useAtomValue } from 'jotai'
import { ReactFlowProvider } from 'reactflow'

import MapFilter from '../components/MapFilter'
import Navbar from '../components/Navbar'
import Atlas from '../components/atlas/Atlas'
import Map from '../components/atlas/Map'
import state from '../state'

const selectedMapAtom = atom(get => {
  const [, currentMap] = get(state.location)
  return currentMap && get(state.ratedMaps).find(m => m.name === currentMap)
})

const AtlasRoute = () => {
  const selectedMap = useAtomValue(selectedMapAtom)

  return (
    <div className="row g-0 overflow-visible position-relative">
      <div className="col-lg-9 col-12">
        <ReactFlowProvider>
          <Atlas selectedMap={selectedMap} />
        </ReactFlowProvider>
      </div>
      <div className="container-fluid col-lg-3 col-12 full-height m-0 p-0 overflow-visible">
        <Navbar close={!!selectedMap && '/#/atlas'} />
        <div className="ms-2 me-2 pb-2">
          <p className="d-block d-lg-none">
            <b className="text-danger">Warning!</b> <b>Atlas</b> view is unsupported on small resolutions, switch back
            to <b>List</b> view.
          </p>
          {selectedMap ? <Map map={selectedMap} /> : <MapFilter sidebar={true} />}
        </div>
      </div>
    </div>
  )
}

export default AtlasRoute
