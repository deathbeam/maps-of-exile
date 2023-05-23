import { useEffect, useRef } from 'react'

export default function useLazy() {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(es => {
      const [e] = es
      if (e.isIntersecting) {
        e.target.classList.remove('lazy-bg')
        observer.unobserve(e.target)
      }
    })

    const cur = ref.current

    if (cur) {
      observer.observe(cur)
    }

    return () => cur && observer.unobserve(cur)
  }, [ref])

  return ref
}
