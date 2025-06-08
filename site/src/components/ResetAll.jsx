import { atom } from 'jotai'
import { useResetAtom } from 'jotai/utils'
import state from '../state'

const ResetAll = () => {
  const allStateInputs = state.input;
  const inputAtoms = Object.values(allStateInputs).map(input => atom(input))
  const resetFns = inputAtoms.map(input => useResetAtom(input.init))

  const handleResetAllInputs = () => {
    resetFns.forEach(reset => reset())
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
