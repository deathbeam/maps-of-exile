import { atom } from 'jotai'
import { RESET } from 'jotai/utils'

function parseValue(val, ref) {
  if (typeof ref === 'number') {
    return parseFloat(val)
  }

  if (typeof ref === 'boolean') {
    if (val === 1) {
      return true
    }

    if (val === 0) {
      return false
    }

    if (val === 'true') {
      return true
    }

    if (val === 'false') {
      return false
    }
  }

  return val
}

export default function atomWithStore(name, def, data) {
  const getInitialValue = () => {
    if (data && data[name]) {
      return parseValue(data[name])
    }

    try {
      const item = localStorage.getItem(name)
      return item && item !== '' ? parseValue(JSON.parse(item), def) : def
    } catch (e) {
      console.warn(e)
      return def
    }
  }

  const baseAtom = atom(getInitialValue())
  const derivedAtom = atom(
    get => get(baseAtom),
    (get, set, e) => {
      let val = e === RESET ? def : e && e.target ? e.target.value : e
      val = val === '' ? def : parseValue(val, def)
      set(baseAtom, val)
      try {
        localStorage.setItem(name, JSON.stringify(val))
        if (data) {
          data[name] = val
        }
      } catch (e) {
        console.warn(e)
      }
    }
  )

  return derivedAtom
}
