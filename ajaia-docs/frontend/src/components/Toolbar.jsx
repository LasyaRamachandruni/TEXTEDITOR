export default function Toolbar({ editor }) {
  if (!editor) return null
  const btn = (action, label, isActive) => (
    <button onClick={action} title={label} className={`px-2 py-1 text-sm rounded transition-colors ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>{label}</button>
  )
  return (
    <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50">
      {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleUnderline().run(), 'U', editor.isActive('underline'))}
      <div className="w-px h-5 bg-gray-300 mx-1" />
      {btn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1', editor.isActive('heading', { level: 1 }))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', editor.isActive('heading', { level: 3 }))}
      <div className="w-px h-5 bg-gray-300 mx-1" />
      {btn(() => editor.chain().focus().toggleBulletList().run(), '• List', editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. List', editor.isActive('orderedList'))}
    </div>
  )
}
