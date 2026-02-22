import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2, Mail, Target, User, Lock, Clock3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Signup = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    targetRole: '',
    dailyAvailableHours: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.targetRole.trim() ||
      !form.dailyAvailableHours
    ) {
      setError('Please fill all fields.')
      return
    }

    setLoading(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        targetRole: form.targetRole.trim(),
        dailyAvailableHours: Number(form.dailyAvailableHours),
      })
      setSuccess('Account created successfully.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg bg-neutral-900/70 border border-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
        <p className="mt-2 text-sm text-neutral-400">Build your personalized productivity engine.</p>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {success}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-neutral-300">Name</span>
            <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/10 px-3">
              <User size={18} className="text-neutral-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full bg-transparent py-3 outline-none text-white placeholder:text-neutral-500"
                placeholder="Your full name"
              />
            </div>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-neutral-300">Email</span>
            <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/10 px-3">
              <Mail size={18} className="text-neutral-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full bg-transparent py-3 outline-none text-white placeholder:text-neutral-500"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-neutral-300">Password</span>
            <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/10 px-3">
              <Lock size={18} className="text-neutral-400" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="w-full bg-transparent py-3 outline-none text-white placeholder:text-neutral-500"
                placeholder="Create a password"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-neutral-300">Target Role</span>
            <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/10 px-3">
              <Target size={18} className="text-neutral-400" />
              <input
                type="text"
                value={form.targetRole}
                onChange={(e) => update('targetRole', e.target.value)}
                className="w-full bg-transparent py-3 outline-none text-white placeholder:text-neutral-500"
                placeholder="Frontend Developer"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-neutral-300">Daily Hours</span>
            <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/10 px-3">
              <Clock3 size={18} className="text-neutral-400" />
              <input
                type="number"
                min="1"
                max="24"
                value={form.dailyAvailableHours}
                onChange={(e) => update('dailyAvailableHours', e.target.value)}
                className="w-full bg-transparent py-3 outline-none text-white placeholder:text-neutral-500"
                placeholder="2"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 font-semibold bg-gradient-to-r from-purple-500 to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-neutral-400 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Login
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Signup
