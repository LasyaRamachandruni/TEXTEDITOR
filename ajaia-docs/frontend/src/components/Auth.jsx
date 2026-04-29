import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email for a confirmation link!')
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ajaia Docs</h1>
          <p className="text-gray-500 mt-2">Collaborative document editing</p>
        </div>
        <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-medium transition-colors ${isLogin ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Sign In</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-medium transition-colors ${!isLogin ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Sign Up</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
          {message && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">{message}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
