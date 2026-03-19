import { useState } from 'react'

export const Profile: React.FC = () => {
    const [name, setName] = useState('Nguyễn Văn A')
    const [email, setEmail] = useState('admin@nexspace.com')
    const [phone, setPhone] = useState('0123456789')
    const [role] = useState('Admin')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const handleSaveProfile = () => {
        console.log({ name, email, phone })
        alert('Đã cập nhật thông tin!')
    }

    const handleChangePassword = () => {
        if (password.length < 6) {
            return setError('Mật khẩu phải >= 6 ký tự')
        }

        if (password !== confirmPassword) {
            return setError('Mật khẩu không khớp')
        }

        setError('')
        alert('Đổi mật khẩu thành công!')
    }

    return (
        <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 pb-15">

            <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
                <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />

                <div className="relative z-10 p-8">
                    <div className="max-w-[900px] mx-auto flex flex-col gap-8">

                        {/* Header */}
                        <div className="glass-panel rounded-xl border border-white/5 p-6 flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold">
                                A
                            </div>

                            <div>
                                <h2 className="text-xl font-bold">{name}</h2>
                                <p className="text-slate-400">{email}</p>
                                <span className="text-xs px-2 py-1 bg-cyan-400/10 text-cyan-400 rounded mt-1 inline-block">
                                    {role}
                                </span>
                            </div>
                        </div>

                        {/* Profile Info */}
                        <section className="glass-panel rounded-xl border border-white/5 p-6 flex flex-col gap-6">
                            <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Name */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-slate-400">Họ tên</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            person
                                        </span>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-10 p-3 rounded-lg bg-[#1a2333] border border-white/10 focus:outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-slate-400">Email</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            mail
                                        </span>
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 p-3 rounded-lg bg-[#1a2333] border border-white/10 focus:outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-slate-400">Số điện thoại</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            call
                                        </span>
                                        <input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-10 p-3 rounded-lg bg-[#1a2333] border border-white/10 focus:outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-slate-400">Vai trò</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            admin_panel_settings
                                        </span>
                                        <input
                                            value={role}
                                            disabled
                                            className="w-full pl-10 p-3 rounded-lg bg-[#0f172a] border border-white/5 text-slate-400"
                                        />
                                    </div>
                                </div>

                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveProfile}
                                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">save</span>
                                    Lưu thông tin
                                </button>
                            </div>
                        </section>

                        {/* Change Password */}
                        <section className="glass-panel rounded-xl border border-white/5 p-6 flex flex-col gap-6">
                            <h3 className="text-lg font-semibold">Đổi mật khẩu</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Password */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-slate-400">Mật khẩu mới</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            lock
                                        </span>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 p-3 rounded-lg bg-[#1a2333] border border-white/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        >
                                            <span className="material-symbols-outlined">
                                                {showPassword ? 'visibility' : 'visibility_off'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-slate-400">Xác nhận mật khẩu</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            lock
                                        </span>
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 p-3 rounded-lg bg-[#1a2333] border border-white/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        >
                                            <span className="material-symbols-outlined">
                                                {showConfirm ? 'visibility' : 'visibility_off'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {error && <p className="text-red-400 text-sm">{error}</p>}

                            <div className="flex justify-end">
                                <button
                                    onClick={handleChangePassword}
                                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">lock_reset</span>
                                    Đổi mật khẩu
                                </button>
                            </div>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    )
}