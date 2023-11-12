import { atom, useAtom } from 'jotai'
import { useMemo } from 'react'

export default function useDerivedAtom(read, write) {
  return useAtom(useMemo(() => atom(read, write), [read, write]))
}
