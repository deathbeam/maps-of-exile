import usePersistedState from './usePersistedState'
import { useCallback, useMemo, useRef } from 'react'

export default function useInputField(key, def, startTransition) {
  const [val, setter] = usePersistedState(key, def, startTransition)
  const ref = useRef()
  const reset = useCallback(() => {
    if (ref.current) {
      ref.current.value = def
    }
    setter(def)
  }, [ref, setter, def])
  return useMemo(
    () => ({
      get: val,
      set: setter,
      ref,
      reset
    }),
    [val, setter, ref, reset]
  )
}
