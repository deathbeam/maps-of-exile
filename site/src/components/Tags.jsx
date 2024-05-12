import { useAtom } from 'jotai'
import { memo } from 'react'

import state from '../state'

const Tags = ({ tags }) => {
  const [parsedSearch, updateSearch] = useAtom(state.parsedSearch)

  return tags.map(t => {
    const val = t.name
    const info = t.info
    let color = t.color

    const searched = parsedSearch.find(c => c.value === val)
    if (searched) {
      color = searched.neg ? 'danger' : 'success'
    }

    const tagDisplay = (
      <button
        className={'btn btn-badge text-dark btn-' + color}
        onClick={() =>
          updateSearch({
            v: val,
            neg: searched ? !searched.neg : false,
            remove: false
          })
        }
      >
        {val} {info && <b>*</b>}
      </button>
    )

    return (
      <span key={val} className="tooltip-tag tooltip-tag-right">
        <span className="tooltip-tag-text">{info}</span>
        <div className="btn-group btn-group-sm m-1">
          {tagDisplay}
          {searched && (
            <button
              className={'btn btn-badge text-dark btn-warning'}
              onClick={() => updateSearch({ v: val, neg: searched.neg, remove: true })}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </span>
    )
  })
}

export default memo(Tags)
