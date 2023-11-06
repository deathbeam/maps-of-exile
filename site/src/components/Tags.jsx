import { useContext } from 'react'
import { AppState } from '../state.js'

const Tags = ({ tags }) => {
  const state = useContext(AppState)
  const search = state.parsedSearch
  const updateSearch = state.updateSearch

  return tags.map(t => {
    const val = t.name
    const info = t.info
    let color = t.color ? t.color : 'secondary'

    const searched = search && search.value.find(c => c.value === val)
    if (searched) {
      color = searched.neg ? 'danger' : 'success'
    }

    const tagDisplay = search ? (
      <button
        className={`btn btn-badge text-dark btn-${color}`}
        onClick={() => updateSearch(val, searched ? !searched.neg : false, false)}
      >
        {val} {info && <b>*</b>}
      </button>
    ) : (
      <span className={`badge text-dark bg-${color}`}>
        {val} {info && <b>*</b>}
      </span>
    )

    return (
      <span key={val} className="tooltip-tag tooltip-tag-right">
        <span className="tooltip-tag-text">{info}</span>
        <div className="btn-group btn-group-sm m-1">
          {tagDisplay}
          {searched && (
            <button
              className={'btn btn-badge text-dark btn-warning'}
              onClick={() => updateSearch(val, searched.neg, true)}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </span>
    )
  })
}

export default Tags
