import { useRef } from 'react'
import usePersistedState from './usePersistedState'

export default function useInputField(key, def, startTransition, locationRef) {
  const ref = useRef(null)
  const [val, setter] = usePersistedState(key, def, startTransition, locationRef)

  return {
    get: val,
    set: setter,
    reset: () => {
      if (ref.current) {
        ref.current.value = def
      }
      setter(def)
    },
    ref
  }
}
