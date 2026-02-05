import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 selection:bg-blue-500/30">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-8">
        <div className="flex gap-6">
          <div className="size-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 animate-pulse">
            <span className="text-3xl font-bold text-blue-400">R</span>
          </div>
          <div className="size-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 animate-pulse">
            <span className="text-3xl font-bold text-cyan-400">T</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            React 19.1 + Tailwind 4.1
          </h1>
          <p className="text-neutral-400 font-medium tracking-wide">
            TALLER SISTEMA DISTRIBUIDO
          </p>
        </div>

        <div className="w-full space-y-4">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-all active:scale-[0.98] cursor-pointer shadow-xl shadow-white/5 group"
          >
            Count is <span className="text-blue-600 transition-colors group-hover:text-blue-500">{count}</span>
          </button>

          <p className="text-center text-sm text-neutral-500">
            Edit <code className="text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">src/App.tsx</code> to start building
          </p>
        </div>
      </div>

      <div className="mt-12 flex gap-4 text-[10px] font-bold text-neutral-700 uppercase tracking-[0.2em]">
        <span>TypeScript</span>
        <span>•</span>
        <span>Vite 6</span>
        <span>•</span>
        <span>Clean Architecture</span>
      </div>
    </div>
  )
}

export default App
