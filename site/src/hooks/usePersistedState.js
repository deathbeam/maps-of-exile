import { useEffect, useState } from 'react'

export default function usePersistedState(key, def, startTransition) {
  const [val, setVal] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item && item !== '' ? JSON.parse(item) : def
    } catch (e) {
      console.warn(e)
      return def
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val))
    } catch (e) {
      console.warn(e)
    }
  }, [key, val])

  return [
    val,
    e => {
      const val = e.hasOwnProperty('target') ? e.target.value : e
      if (startTransition) {
        startTransition(() => setVal(val === '' ? def : val))
      } else {
        setVal(val === '' ? def : val)
      }
    }
  ]
}
