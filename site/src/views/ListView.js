import MapFilter from '../components/MapFilter'
import MapTable from '../components/list/MapTable'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import GoToTop from '../components/GoToTop'

const ListView = ({
  view,
  setView,
  filteredMaps,
  inputs,
  addToInput,
  currentSearch,
  searchInput,
  searchRef,
  setSearchInput,
  voidstonesInput,
  cardValueSourceInput
}) => (
  <>
    <GoToTop />
    <Navbar view={view} setView={setView} />
    <div className="container-fluid p-2 row g-0">
      <MapFilter
        inputs={inputs}
        sidebar={false}
        addToInput={addToInput}
        currentSearch={currentSearch}
        searchInput={searchInput}
        searchRef={searchRef}
        setSearchInput={setSearchInput}
      />
    </div>
    <MapTable maps={filteredMaps} voidstonesInput={voidstonesInput} cardValueSourceInput={cardValueSourceInput} />
    <Footer />
  </>
)

export default ListView
