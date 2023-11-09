import { memo } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import state from '../state.js'
import Tags from './Tags.jsx'

const MapFilterSearch = ({ searchClass }) => {
  const tags = useAtomValue(state.tags)
  const [search, setSearch] = useAtom(state.input.search)

  return (
    <div className={searchClass}>
      <label htmlFor="Search" className="form-label">
        Search
      </label>
      <input
        id="Search"
        className="form-control"
        type="search"
        placeholder="Search for map, tag, card, card reward, comma separated"
        value={search}
        onChange={setSearch}
      />
      <span className="small">tags:</span>
      <Tags tags={tags} />
    </div>
  )
}

export default memo(MapFilterSearch)
