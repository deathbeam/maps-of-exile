import { memo, useEffect, useRef } from 'react'
import { useAtomValue } from 'jotai'
import state from '../state.js'
import Tags from './Tags.jsx'
import { useTransitionAtom } from '../hooks/useTransitionAtom'

const MapFilterSearch = ({ startTransition, searchClass }) => {
  const tags = useAtomValue(state.tags)
  const ref = useRef()
  const search = useAtomValue(state.input.search)
  const setSearch = useTransitionAtom(state.input.search, startTransition)
  useEffect(() => {
    if (ref.current) {
      ref.current.value = search
    }
  }, [search])

  return (
    <div className={searchClass}>
      <label htmlFor="Search" className="form-label">
        Search
      </label>
      <input
        ref={ref}
        id="Search"
        className="form-control"
        type="search"
        placeholder="Search for map, tag, card, card reward, comma separated"
        defaultValue={search}
        onChange={setSearch}
      />
      <span className="small">tags:</span>
      <Tags tags={tags} />
    </div>
  )
}

export default memo(MapFilterSearch)
