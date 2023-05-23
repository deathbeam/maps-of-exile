import { useEffect, useRef, useState } from 'react'

export default function useLazy() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(es => {
      const [e] = es
      if (e.isIntersecting) {
        setVisible(true)
        e.target.classList.remove('lazy-bg')
        observer.unobserve(e.target)
      }
    })

    const cur = ref.current

    if (cur) {
      observer.observe(cur)
    }

    return () => cur && observer.unobserve(cur)
  }, [ref, setVisible])

  return [ref, visible]
}
