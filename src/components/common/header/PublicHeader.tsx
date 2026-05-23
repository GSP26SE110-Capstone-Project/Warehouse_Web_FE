import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../../../assets/logo.png'

type HeaderMode = 'home' | 'aboutus' | 'login'

type PublicHeaderProps = {
    mode?: HeaderMode
    title?: string
    subtitle?: string
    showBackButton?: boolean
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
    mode = 'home',
    title,
    subtitle,
    showBackButton = false,
}) => {
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
                            <Link to="/login" className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:opacity-95 transition-all">
                                Đăng nhập
                            </Link>
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