const Tags = ({ tags, currentSearch, addToInput }) => {
  return tags.map(t => {
    const val = t.name
    const info = t.info
    let color = t.color ? t.color : 'secondary'

    const searched = currentSearch && currentSearch.find(c => c.value === val)
    if (searched) {
      color = searched.neg ? 'danger' : 'success'
    }

    const buttons = []
    if (addToInput) {
      buttons.push(
        <button
          className={'btn btn-badge text-dark btn-' + color}
          onClick={() => addToInput && addToInput(val, searched ? !searched.neg : false, false)}
        >
          {val} {info && <b>*</b>}
        </button>
      )
    } else {
      buttons.push(
        <span className={'badge text-dark bg-' + color}>
          {val} {info && <b>*</b>}
        </span>
      )
    }

    if (searched) {
      buttons.push(
        <button className={'btn btn-badge text-dark btn-warning'} onClick={() => addToInput(val, searched.neg, true)}>
          <i className="fa-solid fa-xmark" />
        </button>
      )
    }

    return info ? (
      <span className="tooltip-tag tooltip-tag-right">
        <span className="tooltip-tag-text tooltip-tag-fill">{info}</span>
        <div className="btn-group btn-group-sm m-1">{buttons}</div>
      </span>
    ) : (
      <div className="btn-group btn-group-sm m-1">{buttons}</div>
    )
  })
}

export default Tags
