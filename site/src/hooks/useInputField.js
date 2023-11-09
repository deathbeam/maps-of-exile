import usePersistedState from './usePersistedState'
import { useMemo } from 'react'

export default function useInputField(key, def, startTransition) {
  const [val, setter] = usePersistedState(key, def, startTransition)
  return useMemo(
    () => ({
      get: val,
      set: setter,
      reset: () => {
        setter(def)
      }
    }),
    [val, setter, def]
  )
}
