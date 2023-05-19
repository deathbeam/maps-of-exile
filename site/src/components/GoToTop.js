import { useEffect, useState } from 'react'

const GoToTop = () => {
  const [showGoTop, setShowGoTop] = useState(false)
  const handleVisibleButton = () => setShowGoTop(window.pageYOffset > 50)
  const handleScrollUp = () => window.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
  useEffect(() => window.addEventListener('scroll', handleVisibleButton), [])

  return (
    <div className={showGoTop ? '' : 'd-none'}>
      <button className="btn btn-lg btn-primary position-fixed bottom-0 end-0 m-2" onClick={handleScrollUp}>
        <i className="fa-solid fa-fw fa-arrow-up" />
      </button>
    </div>
  )
}

export default GoToTop
