const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
async function getHeaders(token) {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
}
export async function listDocuments(token) {
  const res = await fetch(`${API_URL}/documents`, { headers: await getHeaders(token) })
  if (!res.ok) throw new Error('Failed to fetch documents')
  return res.json()
}
export async function createDocument(token, title = 'Untitled Document') {
  const res = await fetch(`${API_URL}/documents`, { method: 'POST', headers: await getHeaders(token), body: JSON.stringify({ title, content: '' }) })
  if (!res.ok) throw new Error('Failed to create document')
  return res.json()
}
export async function getDocument(token, id) {
  const res = await fetch(`${API_URL}/documents/${id}`, { headers: await getHeaders(token) })
  if (!res.ok) throw new Error('Failed to fetch document')
  return res.json()
}
export async function updateDocument(token, id, data) {
  const res = await fetch(`${API_URL}/documents/${id}`, { method: 'PATCH', headers: await getHeaders(token), body: JSON.stringify(data) })
  if (!res.ok) throw new Error('Failed to update document')
  return res.json()
}
export async function deleteDocument(token, id) {
  const res = await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE', headers: await getHeaders(token) })
  if (!res.ok) throw new Error('Failed to delete document')
  return res.json()
}
export async function shareDocument(token, id, email) {
  const res = await fetch(`${API_URL}/documents/${id}/share`, { method: 'POST', headers: await getHeaders(token), body: JSON.stringify({ email }) })
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Failed to share') }
  return res.json()
}
export async function getShares(token, id) {
  const res = await fetch(`${API_URL}/documents/${id}/shares`, { headers: await getHeaders(token) })
  if (!res.ok) throw new Error('Failed to fetch shares')
  return res.json()
}
export async function removeShare(token, docId, shareId) {
  const res = await fetch(`${API_URL}/documents/${docId}/share/${shareId}`, { method: 'DELETE', headers: await getHeaders(token) })
  if (!res.ok) throw new Error('Failed to remove share')
  return res.json()
}
export async function uploadFile(token, file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_URL}/documents/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData })
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Upload failed') }
  return res.json()
}
