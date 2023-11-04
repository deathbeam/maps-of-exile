import { useEffect, useState } from 'react'
import { parseValue } from '../common'

let data = {}
let dataEnabled = false
if (window.location.hash && dataEnabled) {
  try {
    data = JSON.parse(atob(window.location.hash.replace('#', ''))) || {}
  } catch (e) {
    window.location.hash = ''
    data = {}
  }
}

export default function usePersistedState(key, def, startTransition, locationRef) {
  const [val, setVal] = useState(() => {
    if (locationRef && data[key]) {
      return parseValue(data[key])
    }

    try {
      const item = localStorage.getItem(key)
      return item && item !== '' ? parseValue(JSON.parse(item), def) : def
    } catch (e) {
      console.warn(e)
      return def
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val))
      if (locationRef) {
        data[key] = val
        if (locationRef.current) {
          locationRef.current.value = 'https://mapsofexile.com/#' + btoa(JSON.stringify(data))
        }
      }
    } catch (e) {
      console.warn(e)
    }
  }, [key, val, locationRef])

  return [
    val,
    e => {
      const val = Object.hasOwn(e, 'target') ? e.target.value : e
      if (startTransition) {
        startTransition(() => setVal(val === '' ? def : parseValue(val, def)))
      } else {
        setVal(val === '' ? def : parseValue(val, def))
      }
    }
  ]
}
