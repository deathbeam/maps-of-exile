import usePersistedState from './usePersistedState'
import { useMemo, useRef } from 'react'

export default function useInputField(key, def, startTransition) {
  const [val, setter] = usePersistedState(key, def, startTransition)
  const ref = useRef()
  return useMemo(
    () => ({
      get: val,
      set: setter,
      ref: ref,
      reset: () => {
        if (ref.current) {
          ref.current.value = def
        }
        setter(def)
      }
    }),
    [val, setter, def]
  )
}
