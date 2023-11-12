import { atom } from 'jotai'
import { RESET } from 'jotai/utils'

export default function atomWithHash() {
  const valAtom = atom(window.location.hash.slice(1))
  valAtom.onMount = set => {
    const callback = () => {
      set(window.location.hash.slice(1))
    }

    window.addEventListener('hashchange', callback)
    return () => {
      window.removeEventListener('hashchange', callback)
    }
  }

  const derivedAtom = atom(
    get =>
      get(valAtom)
        .replaceAll('%20', ' ')
        .split('/')
        .filter(l => l),
    (get, set, v) => {
      let val = v === RESET ? '' : v
      set(valAtom, v)
      window.location.hash = val.toString()
    }
  )

  return derivedAtom
}
