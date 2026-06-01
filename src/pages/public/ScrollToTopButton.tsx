import React, { useState, useEffect } from 'react'

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }
    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!isVisible) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 w-11 h-11 bg-[#0077b6] hover:bg-[#0096c7] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none"
      aria-label="Scroll to top"
    >
      <span className="material-symbols-outlined text-2xl transition-transform group-hover:-translate-y-0.5">
        arrow_upward
      </span>
    </button>
  )
}