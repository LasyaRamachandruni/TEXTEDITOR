import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Toolbar from './Toolbar'
import ShareModal from './ShareModal'
import { updateDocument } from '../api'

export default function Editor({ doc, session, isOwner, onTitleChange }) {
  const [title, setTitle] = useState(doc.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [showShare, setShowShare] = useState(false)
  const saveTimer = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false }),
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList, OrderedList, ListItem,
    ],
    content: doc.content || '',
    editable: isOwner,
    onUpdate: ({ editor }) => {
      if (!isOwner) return
      setSaveStatus('unsaved')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => { saveContent(editor.getHTML()) }, 1500)
    }
  })

  useEffect(() => {
    setTitle(doc.title)
    if (editor && doc.content !== editor.getHTML()) editor.commands.setContent(doc.content || '')
  }, [doc.id])

  const saveContent = useCallback(async (content) => {
    try { await updateDocument(session.access_token, doc.id, { content }); setSaveStatus('saved') }
    catch { setSaveStatus('error') }
  }, [doc.id, session.access_token])

  const saveTitle = async (newTitle) => {
    if (!newTitle.trim()) return
    try { await updateDocument(session.access_token, doc.id, { title: newTitle }); onTitleChange(doc.id, newTitle) }
    catch (err) { console.error(err) }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          {editingTitle && isOwner ? (
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              onBlur={() => { setEditingTitle(false); saveTitle(title) }}
              onKeyDown={e => { if (e.key === 'Enter') { setEditingTitle(false); saveTitle(title) } }}
              className="text-xl font-semibold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent" />
          ) : (
            <h2 onClick={() => isOwner && setEditingTitle(true)} className={`text-xl font-semibold text-gray-900 truncate ${isOwner ? 'cursor-pointer hover:text-blue-600' : ''}`} title={isOwner ? 'Click to rename' : ''}>
              {title}
            </h2>
          )}
          {!isOwner && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">View only</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${saveStatus === 'saved' ? 'text-green-600' : saveStatus === 'unsaved' ? 'text-yellow-600' : 'text-red-600'}`}>
            {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'unsaved' ? '● Saving...' : '✗ Error'}
          </span>
          {isOwner && <button onClick={() => setShowShare(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">Share</button>}
        </div>
      </div>
      {isOwner && <Toolbar editor={editor} />}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <EditorContent editor={editor} className="prose max-w-none" />
        </div>
      </div>
      {showShare && <ShareModal doc={{ ...doc, title }} session={session} onClose={() => setShowShare(false)} />}
    </div>
  )
}
