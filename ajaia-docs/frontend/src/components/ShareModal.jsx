import { useState, useEffect } from 'react'
import { shareDocument, getShares, removeShare } from '../api'

export default function ShareModal({ doc, session, onClose }) {
  const [email, setEmail] = useState('')
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadShares() }, [doc.id])

  const loadShares = async () => {
    try { const data = await getShares(session.access_token, doc.id); setShares(data) }
    catch (err) { console.error(err) }
  }

  const handleShare = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      await shareDocument(session.access_token, doc.id, email)
      setSuccess(`Shared with ${email}`); setEmail(''); loadShares()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleRemove = async (shareId) => {
    try { await removeShare(session.access_token, doc.id, shareId); loadShares() }
    catch (err) { setError(err.message) }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Share "{doc.title}"</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleShare} className="flex gap-2 mb-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email address" required className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? '...' : 'Share'}</button>
        </form>
        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3 bg-green-50 p-2 rounded">{success}</p>}
        {shares.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shared With</p>
            <div className="space-y-2">
              {shares.map(share => (
                <div key={share.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👤</span>
                    <span className="text-sm text-gray-700">{share.shared_with_email}</span>
                    <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">Viewer</span>
                  </div>
                  <button onClick={() => handleRemove(share.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
              ))}
            </div>
          </div>
        ) : <p className="text-sm text-gray-400 text-center py-2">Not shared with anyone yet</p>}
      </div>
    </div>
  )
}
