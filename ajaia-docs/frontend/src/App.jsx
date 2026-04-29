import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import { listDocuments, createDocument, deleteDocument, getDocument } from './api'

export default function App() {
  const [session, setSession] = useState(null)
  const [docs, setDocs] = useState({ owned: [], shared: [] })
  const [currentDoc, setCurrentDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { if (session) loadDocs() }, [session])

  const loadDocs = async () => {
    try {
      const data = await listDocuments(session.access_token)
      setDocs(data)
    } catch (err) { console.error(err) }
  }

  const handleSelectDoc = async (doc) => {
    try {
      const full = await getDocument(session.access_token, doc.id)
      setCurrentDoc(full)
      setIsOwner(full.owner_id === session.user.id)
    } catch (err) { console.error(err) }
  }

  const handleCreate = async () => {
    try {
      const doc = await createDocument(session.access_token)
      setDocs(prev => ({ ...prev, owned: [doc, ...prev.owned] }))
      setCurrentDoc(doc)
      setIsOwner(true)
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return
    try {
      await deleteDocument(session.access_token, id)
      setDocs(prev => ({ ...prev, owned: prev.owned.filter(d => d.id !== id) }))
      if (currentDoc?.id === id) setCurrentDoc(null)
    } catch (err) { console.error(err) }
  }

  const handleUpload = (doc) => {
    setDocs(prev => ({ ...prev, owned: [doc, ...prev.owned] }))
    setCurrentDoc(doc)
    setIsOwner(true)
  }

  const handleTitleChange = (id, newTitle) => {
    setDocs(prev => ({ ...prev, owned: prev.owned.map(d => d.id === id ? { ...d, title: newTitle } : d) }))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setCurrentDoc(null)
    setDocs({ owned: [], shared: [] })
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>
  if (!session) return <Auth />

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar docs={docs} currentDoc={currentDoc} onSelect={handleSelectDoc} onCreate={handleCreate} onDelete={handleDelete} onUpload={handleUpload} session={session} onSignOut={handleSignOut} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentDoc ? (
          <Editor key={currentDoc.id} doc={currentDoc} session={session} isOwner={isOwner} onTitleChange={handleTitleChange} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to Ajaia Docs</h2>
            <p className="text-gray-400 mb-6">Create a new document or select one from the sidebar</p>
            <button onClick={handleCreate} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">Create New Document</button>
            <button onClick={handleSignOut} className="mt-4 text-sm text-gray-400 hover:text-gray-600">Sign out</button>
          </div>
        )}
      </div>
    </div>
  )
}
