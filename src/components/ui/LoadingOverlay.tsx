import React from 'react'

type Props = {
  show: boolean
  text?: string
}

export const LoadingOverlay: React.FC<Props> = ({
  show,
  text = 'SCANNING SYSTEM...',
}) => {
  if (!show) return null

  return (
    <>
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050b0b]/90 backdrop-blur-sm">

        {/* KHUNG SCAN */}
        <div className="relative h-[220px] w-[220px] border border-cyan-400/20 rounded-lg overflow-hidden flex items-center justify-center">

          {/* GRID */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6,237,249,0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6,237,249,0.08) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />

          {/* 🔥 THANH SCAN DỌC */}
          <div className="absolute left-0 w-full h-[40%] bg-gradient-to-b from-transparent via-cyan-400/80 to-transparent animate-scan-vertical" />

          {/* TEXT */}
          <span className="text-xs tracking-widest text-cyan-400 z-10 animate-pulse text-center px-2">
            {text}
          </span>
        </div>
      </div>

      {/* ✅ CSS GẮN TRỰC TIẾP */}
      <style>
        {`
          @keyframes scanVertical {
            0% {
              top: -40%;
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              top: 100%;
              opacity: 0;
            }
          }

          .animate-scan-vertical {
            animation: scanVertical 1.6s linear infinite;
          }
        `}
      </style>
    </>
  )
}