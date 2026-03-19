import { useState } from 'react'

export const AdminSettings: React.FC = () => {
  const [systemName, setSystemName] = useState('NEXSPACE')
  const [email, setEmail] = useState('admin@nexspace.com')
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState('vi')

  const handleSave = () => {
    console.log({
      systemName,
      email,
      darkMode,
      notifications,
      language,
    })

    alert('Đã lưu cài đặt!')
  }

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 pb-15">

      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />

        <div className="relative z-10 p-8">
          <div className="max-w-[1000px] mx-auto flex flex-col gap-8">

            {/* Title */}
            <h2 className="text-2xl font-bold text-white tracking-wide">
              ⚙️ CÀI ĐẶT HỆ THỐNG
            </h2>

            {/* General Settings */}
            <section className="glass-panel rounded-xl border border-white/5 p-6 flex flex-col gap-6">
              <h3 className="text-lg font-semibold text-white">Thông tin hệ thống</h3>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-400">Tên hệ thống</label>
                <input
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  className="p-3 rounded-lg bg-[#1a2333] border border-white/10 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-400">Email admin</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="p-3 rounded-lg bg-[#1a2333] border border-white/10 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </section>

            {/* Preferences */}
            <section className="glass-panel rounded-xl border border-white/5 p-6 flex flex-col gap-6">
              <h3 className="text-lg font-semibold text-white">Tùy chọn</h3>

              {/* Dark mode */}
              <div className="flex items-center justify-between">
                <span>Dark Mode</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition ${
                    darkMode ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transform transition ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between">
                <span>Thông báo</span>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full transition ${
                    notifications ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transform transition ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Language */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-400">Ngôn ngữ</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="p-3 rounded-lg bg-[#1a2333] border border-white/10 focus:outline-none"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
            </section>

            {/* Security */}
            <section className="glass-panel rounded-xl border border-white/5 p-6 flex flex-col gap-6">
              <h3 className="text-lg font-semibold text-white">Bảo mật</h3>

              <button className="flex items-center gap-2 px-4 py-3 bg-[#1a2333] border border-white/10 rounded-lg hover:bg-white/10">
                <span className="material-symbols-outlined">lock_reset</span>
                Đổi mật khẩu admin
              </button>

              <button className="flex items-center gap-2 px-4 py-3 bg-[#1a2333] border border-white/10 rounded-lg hover:bg-white/10">
                <span className="material-symbols-outlined">verified_user</span>
                Quản lý phân quyền
              </button>
            </section>

            {/* Save */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold"
              >
                💾 Lưu cài đặt
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}