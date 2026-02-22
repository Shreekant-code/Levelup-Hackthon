import { Link } from 'react-router-dom'

export const Dashboard = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <section className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-cyan-400">Dashboard</h1>
        <p className="text-slate-300">
          Your router is working. Replace this with your real productivity dashboard UI.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-full bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400 transition"
        >
          Back to Home
        </Link>
      </section>
    </main>
  )
}
