import { useState, useEffect, type ChangeEvent } from 'react'
import { navigationService } from '../../../utils/NavigationService'
import { api } from '../../../utils/Axios'

type AdminHeaderProps = {
  title?: string
  onSearchChange?: (value: string) => void
}

interface CurrentUserResponse {
  success: boolean
  message: string
  data: {
    userId: string
    fullName: string
    email: string
    role: string
    status: string
  }
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title = 'SYSTEM ADMIN DASHBOARD',
  onSearchChange,
}) => {
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('Người dùng')
  const [role, setRole] = useState('Thành viên')
  const [loading, setLoading] = useState(true)

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(event.target.value)
  }

  // Gọi API để lấy thông tin user hiện tại
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true)
        const response = await api.get<CurrentUserResponse>('/users/me')

        if (response.data?.success && response.data?.data) {
          const userData = response.data.data
          setUserId(userData.userId)
          setUsername(userData.fullName || 'Người dùng')
          setRole(userData.role || 'Thành viên')
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin user hiện tại:', error)
        // Fallback về localStorage nếu API fail
        setUserId(localStorage.getItem('userId') || '')
        setUsername(localStorage.getItem('fullName') || 'Người dùng')
        setRole(localStorage.getItem('role') || 'Thành viên')
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  return (
    <header className="relative z-10 flex items-center justify-between border-b border-white/5 bg-[#0b101a]/40 px-8 py-5 backdrop-blur-md">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* <div className="group relative hidden w-96 md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-symbols-outlined text-slate-500 transition-colors group-focus-within:text-[#06edf9]">
              search
            </span>
          </div>
          <input
            type="text"
            placeholder="Search SKU, Serial, or Location..."
            onChange={handleSearchChange}
            className="block w-full rounded-lg border border-white/10 bg-[#1a2333]/60 py-2.5 pl-10 pr-3 font-mono text-sm text-white placeholder-slate-500 transition-all focus:border-[#06edf9]/50 focus:outline-none focus:ring-1 focus:ring-[#06edf9]"
          />
        </div> */}

        {/* <button className="relative p-2 text-slate-400 transition-colors hover:text-white">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#06edf9] shadow-[0_0_8px_rgba(6,237,249,0.8)]" />
        </button> */}

        <div
          onClick={() => navigationService.goTo(userId ? `/profile/${userId}` : '/profile')}
          className="flex items-center gap-3 border-l border-white/10 pl-6 cursor-pointer"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-white">{username}</p>
            <p className="text-xs text-slate-400">{role}</p>
          </div>
          <div className="size-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1px]">
            <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-slate-900">
              {loading ? (
                <div className="animate-spin">
                  <span className="material-symbols-outlined text-xs">hourglass_empty</span>
                </div>
              ) : (
                <span className="text-sm font-bold uppercase text-cyan-400">
                  {username ? username.charAt(0) : '?'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}