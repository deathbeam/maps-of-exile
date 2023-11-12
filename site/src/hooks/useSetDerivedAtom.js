import { atom, useSetAtom } from 'jotai'
import { useMemo } from 'react'

export default function useSetDerivedAtom(write) {
  return useSetAtom(useMemo(() => atom(null, write), [write]))
}
