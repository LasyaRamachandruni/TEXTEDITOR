import { useState, useRef } from 'react'
import { uploadFile } from '../api'

export default function Sidebar({ docs, currentDoc, onSelect, onCreate, onDelete, session, onUpload, onSignOut }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef()

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true); setUploadError('')
    try { const doc = await uploadFile(session.access_token, file); onUpload(doc) }
    catch (err) { setUploadError(err.message) }
    finally { setUploading(false); fileRef.current.value = '' }
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">Ajaia Docs</h1>
        <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
      </div>
      <div className="p-3 space-y-2">
        <button onClick={onCreate} className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">+ New Document</button>
        <label className={`w-full flex items-center justify-center text-sm py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? 'Uploading...' : '↑ Upload File'}
          <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        <p className="text-xs text-gray-400 text-center">.txt and .md only</p>
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      </div>
      <div className="flex-1 overflow-y-auto">
        {docs.owned.length > 0 && (
          <div>
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">My Documents</p>
            {docs.owned.map(doc => <DocItem key={doc.id} doc={doc} isActive={currentDoc?.id === doc.id} isOwned={true} onSelect={onSelect} onDelete={onDelete} />)}
          </div>
        )}
        {docs.shared.length > 0 && (
          <div>
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Shared With Me</p>
            {docs.shared.map(doc => <DocItem key={doc.id} doc={doc} isActive={currentDoc?.id === doc.id} isOwned={false} onSelect={onSelect} onDelete={onDelete} />)}
          </div>
        )}
        {docs.owned.length === 0 && docs.shared.length === 0 && <p className="text-sm text-gray-400 text-center py-8 px-4">No documents yet. Create your first one!</p>}
      </div>
      <div className="p-3 border-t border-gray-200">
        <button onClick={onSignOut} className="w-full text-sm py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">Sign Out</button>
      </div>
    </div>
  )
}

function DocItem({ doc, isActive, isOwned, onSelect, onDelete }) {
  return (
    <div onClick={() => onSelect(doc)} className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors group ${isActive ? 'bg-blue-50 border-r-2 border-blue-600' : ''}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base">📄</span>
        <div className="min-w-0">
          <p className={`text-sm truncate ${isActive ? 'font-medium text-blue-700' : 'text-gray-700'}`}>{doc.title}</p>
          {!isOwned && <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Shared</span>}
        </div>
      </div>
      {isOwned && <button onClick={(e) => { e.stopPropagation(); onDelete(doc.id) }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs px-1 transition-opacity">✕</button>}
    </div>
  )
}
