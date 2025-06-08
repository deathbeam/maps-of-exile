import { useResetAtom } from 'jotai/utils'

import state from '../state'

const ResetAll = () => {
  const inputAtoms = Object.values(state.input)
  const resetFns = inputAtoms.map(atom => useResetAtom(atom))

  const handleResetAllInputs = () => {
    if (window.confirm('Are you sure you want to reset all inputs?')) {
      resetFns.forEach(reset => reset())
    }
  }

  return (
    <div className="ms-auto me-2">
      <button className="btn btn-outline-primary" onClick={handleResetAllInputs}>
        <i className="fa-solid fa-refresh fa-fw" />
      </button>
    </div>
  )
}

export default ResetAll
