import { useState } from 'react'
import logo from '../../assets/logo.png'
import { navigationService } from '../../utils/NavigationService'


export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('')

    const handleSubmit = () => {
        // TODO: call API
        console.log('Send reset link to:', email)

        // demo: chuyển sang reset password
        navigationService.goTo('/reset-password')
    }

    return (
        <div
            className="font-['Inter',sans-serif] relative min-h-screen flex flex-col overflow-hidden"
            style={{ background: '#050b0b', color: '#fff' }}
        >
            {/* Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                    className="w-full h-full object-cover opacity-30 blur-sm scale-105"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXarldI6DEHoSyQKxf1Ij69kQAgFbbWOCmHHQXVURcOZC0E6a1dH6LEAyfUU_oE9ExY25IE5kjckyS_qB7w--6UAG7g3dUQqV0gb1mW1sT2HqUNdDtiNFeXbe4NVBgRxHURhim9jCe7WybzvyVwHF-E6tAOpEgfWGFtE5k5hoEHHfHpfW8pHvHQU1gJX3WzbgK3uatQp5u4GQKaAq0LnqXAyCntFjWf63OpUayjGo48M9ntC8x9RLq1Hoze4o28I_jQRyG1r9Ljck"
                    alt="background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0f2223cc] via-[#0f222399] to-[#0f2223e6]" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="glass-panel w-full max-w-[520px] rounded-2xl overflow-hidden relative">

                    {/* Header */}
                    <div className="p-8 pb-4 border-b border-white/5">
                        <div className="flex flex-col items-center justify-center text-center gap-2">
                            <div className="flex items-center gap-2 justify-center">
                                <img src={logo} alt="Logo" className="h-10 w-10" />
                                <h1 className="text-3xl font-black tracking-[-0.02em] text-white m-0">
                                    NEXSPACE
                                </h1>
                            </div>

                            <p
                                className="text-2xl font-medium tracking-widest uppercase"
                                style={{ color: '#9bb9bb' }}
                            >
                                Reset Password
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-8 flex flex-col gap-6">
                        <p className="text-sm text-gray-400 text-center">
                            Nhập email để nhận link đặt lại mật khẩu
                        </p>

                        <input
                            type="email"
                            placeholder="@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="p-4 bg-transparent border border-[#3a5455] rounded-lg"
                        />

                        <button
                            onClick={handleSubmit}
                            className="py-4 bg-[#06edf9] text-black font-bold rounded-lg"
                        >
                            Gửi yêu cầu
                        </button>

                        <button
                            onClick={() => navigationService.goBack()}
                            className="text-sm text-[#06edf9]"
                        >
                            ← Quay lại
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}

