from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Ajaia Docs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://lasya-five.vercel.app", "https://lasya-3fhkdgivu-lasyaramachandrunis-projects.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

async def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {token}"}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    return resp.json()

class DocumentCreate(BaseModel):
    title: str = "Untitled Document"
    content: str = ""

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class ShareRequest(BaseModel):
    email: str

@app.get("/documents")
async def list_documents(user=Depends(get_current_user)):
    uid = user["id"]
    async with httpx.AsyncClient() as client:
        owned = await client.get(f"{SUPABASE_URL}/rest/v1/documents?owner_id=eq.{uid}&select=*&order=updated_at.desc", headers=supabase_headers())
        shares = await client.get(f"{SUPABASE_URL}/rest/v1/document_shares?shared_with_id=eq.{uid}&select=document_id", headers=supabase_headers())
        shared_ids = [s["document_id"] for s in shares.json()]
        shared_docs = []
        if shared_ids:
            ids_str = ",".join(shared_ids)
            shared_resp = await client.get(f"{SUPABASE_URL}/rest/v1/documents?id=in.({ids_str})&select=*&order=updated_at.desc", headers=supabase_headers())
            shared_docs = shared_resp.json()
    return {"owned": owned.json(), "shared": shared_docs}

@app.post("/documents")
async def create_document(doc: DocumentCreate, user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{SUPABASE_URL}/rest/v1/documents", headers=supabase_headers(), json={"title": doc.title, "content": doc.content, "owner_id": user["id"]})
    if resp.status_code not in [200, 201]:
        raise HTTPException(status_code=400, detail="Failed to create document")
    return resp.json()[0]

@app.get("/documents/{doc_id}")
async def get_document(doc_id: str, user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{SUPABASE_URL}/rest/v1/documents?id=eq.{doc_id}&select=*", headers=supabase_headers())
    docs = resp.json()
    if not docs:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = docs[0]
    uid = user["id"]
    if doc["owner_id"] != uid:
        async with httpx.AsyncClient() as client:
            share = await client.get(f"{SUPABASE_URL}/rest/v1/document_shares?document_id=eq.{doc_id}&shared_with_id=eq.{uid}", headers=supabase_headers())
        if not share.json():
            raise HTTPException(status_code=403, detail="Access denied")
    return doc

@app.patch("/documents/{doc_id}")
async def update_document(doc_id: str, update: DocumentUpdate, user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        existing = await client.get(f"{SUPABASE_URL}/rest/v1/documents?id=eq.{doc_id}&select=owner_id", headers=supabase_headers())
    docs = existing.json()
    if not docs or docs[0]["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can edit")
    payload = {k: v for k, v in update.dict().items() if v is not None}
    payload["updated_at"] = "now()"
    async with httpx.AsyncClient() as client:
        resp = await client.patch(f"{SUPABASE_URL}/rest/v1/documents?id=eq.{doc_id}", headers=supabase_headers(), json=payload)
    return resp.json()

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        existing = await client.get(f"{SUPABASE_URL}/rest/v1/documents?id=eq.{doc_id}&select=owner_id", headers=supabase_headers())
    docs = existing.json()
    if not docs or docs[0]["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can delete")
    async with httpx.AsyncClient() as client:
        await client.delete(f"{SUPABASE_URL}/rest/v1/documents?id=eq.{doc_id}", headers=supabase_headers())
    return {"status": "deleted"}

@app.post("/documents/{doc_id}/share")
async def share_document(doc_id: str, req: ShareRequest, user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        existing = await client.get(f"{SUPABASE_URL}/rest/v1/documents?id=eq.{doc_id}&select=owner_id", headers=supabase_headers())
    docs = existing.json()
    if not docs or docs[0]["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can share")
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"})
    users = user_resp.json().get("users", [])
    target = next((u for u in users if u["email"] == req.email), None)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{SUPABASE_URL}/rest/v1/document_shares", headers=supabase_headers(), json={"document_id": doc_id, "shared_with_email": req.email, "shared_with_id": target["id"]})
    if resp.status_code not in [200, 201]:
        raise HTTPException(status_code=400, detail="Already shared or error")
    return {"status": "shared", "email": req.email}

@app.get("/documents/{doc_id}/shares")
async def get_shares(doc_id: str, user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{SUPABASE_URL}/rest/v1/document_shares?document_id=eq.{doc_id}&select=*", headers=supabase_headers())
    return resp.json()

@app.delete("/documents/{doc_id}/share/{share_id}")
async def remove_share(doc_id: str, share_id: str, user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        await client.delete(f"{SUPABASE_URL}/rest/v1/document_shares?id=eq.{share_id}", headers=supabase_headers())
    return {"status": "removed"}

@app.post("/documents/upload")
async def upload_file(file: UploadFile = File(...), user=Depends(get_current_user)):
    allowed = [".txt", ".md"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only .txt and .md files supported")
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    title = os.path.splitext(file.filename)[0]
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{SUPABASE_URL}/rest/v1/documents", headers=supabase_headers(), json={"title": title, "content": text, "owner_id": user["id"]})
    if resp.status_code not in [200, 201]:
        raise HTTPException(status_code=400, detail="Failed to create document from file")
    return resp.json()[0]

@app.get("/health")
async def health():
    return {"status": "ok"}
