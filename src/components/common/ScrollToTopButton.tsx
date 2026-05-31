import { useEffect, useState, type RefObject } from 'react'

type ScrollToTopButtonProps = {
  /** Khi set — lắng nghe scroll của phần tử (vd. `<main>` trong layout). Mặc định: window. */
  scrollTargetRef?: RefObject<HTMLElement | null>
  threshold?: number
  className?: string
}

export function ScrollToTopButton({
  scrollTargetRef,
  threshold = 400,
  className = '',
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = scrollTargetRef?.current ?? null
    const getScrollTop = () => (el ? el.scrollTop : window.scrollY)
    const onScroll = () => setVisible(getScrollTop() > threshold)

    onScroll()

    if (el) {
      el.addEventListener('scroll', onScroll, { passive: true })
      return () => el.removeEventListener('scroll', onScroll)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollTargetRef, threshold])

  const handleClick = () => {
    const el = scrollTargetRef?.current
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
      className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[#06edf9]/35 bg-[#050b0b]/90 text-[#06edf9] shadow-lg backdrop-blur transition-all duration-200 hover:border-[#06edf9]/60 hover:bg-[#06edf9]/10 hover:scale-105 active:scale-95 ${className}`}
    >
      <span className="material-symbols-outlined text-2xl">keyboard_arrow_up</span>
    </button>
  )
}
