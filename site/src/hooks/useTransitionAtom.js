import { useSetAtom } from 'jotai/react'
import { useCallback } from 'react'

export function useTransitionAtom(anAtom, startTransition, options) {
  const setAtom = useSetAtom(anAtom, options)
  return useCallback(
    value => {
      if (!startTransition) {
        return setAtom(value)
      }
      return startTransition(() => setAtom(value))
    },
    [setAtom, startTransition]
  )
}
