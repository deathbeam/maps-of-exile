import { useAtomValue } from 'jotai'
import { useEffect } from 'react'

import state from '../state'

const ScrollToTop = () => {
  const location = useAtomValue(state.location)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])

  return null
}

export default ScrollToTop
