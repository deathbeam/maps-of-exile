import { atom, useAtomValue } from 'jotai'
import { useMemo } from 'react'

export default function useDerivedAtomValue(read) {
  return useAtomValue(useMemo(() => atom(read), [read]))
}
