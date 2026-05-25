import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/logo.png'

type HeaderMode = 'home' | 'aboutus' | 'login'

type PublicHeaderProps = {
    mode?: HeaderMode
    title?: string
    subtitle?: string
    showBackButton?: boolean
}

interface User {
    userId: string
    email: string
    fullName: string
    role: string
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
    mode = 'home',
    title,
    subtitle,
    showBackButton = false,
}) => {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const [showProfileMenu, setShowProfileMenu] = useState(false)

    useEffect(() => {
        const userString = localStorage.getItem('user')
        if (userString) {
            try {
                const userData = JSON.parse(userString)
                setUser(userData)
            } catch (err) {
                console.error('Lỗi parse user:', err)
            }
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        setUser(null)
        navigate('/')
    }

    return (
        <header className="w-full border-b border-slate-200 bg-white p-6 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                    {showBackButton && (
                        <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-600 hover:text-cyan-700 mb-1">
                            <span className="material-symbols-outlined text-xs">arrow_back</span> Quay lại
                        </Link>
                    )}

                    {mode === 'home' && (
                        <div className="flex items-center gap-2">
                            <div className="flex size-15 items-center justify-center flex size-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-900 to-slate-900">
                                <img src={logo} alt="Logo" className="h-14 w-14" />
                            </div>

                            <div className="flex flex-col">
                                <h1 className="text-3xl font-black text-blue-800">NEXSPACE</h1>
                                <p className="font-medium text-lg text-cyan-800/60">Warehouse</p>
                            </div>
                        </div>
                    )}

                    {mode === 'aboutus' && (
                        <>
                            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                {title || 'Hồ Sơ Năng Lực'}
                            </h1>
                            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                        </>
                    )}

                    {mode === 'login' && (
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {title || 'Đăng Nhập Hệ Thống'}
                        </h1>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {mode === 'home' && (
                        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
                            <Link to="/about-us" className="text-slate-600 hover:text-cyan-600 transition-colors">
                                Về chúng tôi
                            </Link>

                            {/* Nếu chưa đăng nhập: hiển thị nút Đăng nhập */}
                            {!user ? (
                                <Link to="/login" className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:opacity-95 transition-all">
                                    Đăng nhập
                                </Link>
                            ) : (
                                /* Nếu đã đăng nhập: hiển thị Profile menu */
                                <div className="relative">
                                    <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-base">account_circle</span>
                                        <span className="text-xs font-bold">{user.fullName}</span>
                                    </button>

                                    {/* Dropdown menu */}
                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                                            <div className="p-4 border-b border-slate-100">
                                                <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>

                                            <Link
                                                to="/admin-tenant/dashboard"
                                                className="flex items-center gap-2 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                onClick={() => setShowProfileMenu(false)}
                                            >
                                                <span className="material-symbols-outlined text-base">person</span>
                                                Hồ sơ
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                                            >
                                                <span className="material-symbols-outlined text-base">logout</span>
                                                Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </nav>
                    )}

                    {mode === 'aboutus' && (
                        <span className="text-xs px-2.5 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 font-mono rounded-md font-bold">
                            INFO v2.0
                        </span>
                    )}

                    {mode === 'login' && (
                        <Link to="/" className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                            Trang chủ
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}