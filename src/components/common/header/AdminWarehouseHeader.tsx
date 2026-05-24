import { useState, useEffect, type ChangeEvent } from 'react'
import { navigationService } from '../../../utils/NavigationService'
import { api } from '../../../utils/Axios'

type AdminWarehouseHeaderProps = {
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

export const AdminWarehouseHeader: React.FC<AdminWarehouseHeaderProps> = ({
  title = 'Admin Warehouse Dashboard',
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
    <header className="relative z-10 flex h-16 items-center justify-between bg-white px-8 transition-colors duration-300">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Input Tìm kiếm nếu cần mở lại trong tương lai */}
        {/* <div className="group relative hidden w-80 md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-symbols-outlined text-slate-400 transition-colors group-focus-within:text-cyan-600">
              search
            </span>
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            onChange={handleSearchChange}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:border-cyan-500 focus:outline-none"
          />
        </div> */}

        {/* Nút thông báo nếu cần mở lại */}
        {/* <button className="relative p-2 text-slate-400 transition-colors hover:text-slate-600">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-cyan-500" />
        </button> */}

        {/* Profile điều hướng */}
        <div
          onClick={() => navigationService.goTo(userId ? `/profile/${userId}` : '/profile')}
          className="flex items-center gap-3 border-l border-slate-100 pl-6 cursor-pointer group select-none"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-cyan-600 transition-colors">{username}</p>
            <p className="text-xs font-medium text-slate-400 mt-0.5">{role}</p>
          </div>
          
          {/* Avatar container */}
          <div className="size-9 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-[1px] shadow-sm">
            <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-white">
              {loading ? (
                <div className="animate-spin flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-slate-400">hourglass_empty</span>
                </div>
              ) : (
                <span className="text-sm font-bold uppercase text-cyan-600">
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