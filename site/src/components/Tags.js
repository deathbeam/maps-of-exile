const Tags = ({ tags, currentSearch, addToInput }) => {
  return tags.map(t => {
    const val = t.name
    const info = t.info
    let color = t.color ? 'btn-' + t.color : 'btn-secondary'

    const searched = currentSearch && currentSearch.find(c => c.value === val)
    if (searched) {
      color = searched.neg ? 'btn-danger' : 'btn-success'
    }

    const buttons = []
    buttons.push(
      <button
        className={'btn btn-badge text-dark ' + color}
        onClick={() => addToInput && addToInput(val, searched ? !searched.neg : false, false)}
      >
        {val} {info && <b>*</b>}
      </button>
    )

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
