from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from supabase import Client

from db import get_db
from db.schemas import Collection, CollectionCreate, CollectionUpdate


router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("", response_model=List[Collection])
def list_collections(owner_id: Optional[UUID] = None, visibility: Optional[str] = None, db: Client = Depends(get_db)):
    query = db.table("collections").select("*")
    if owner_id:
        query = query.eq("owner_id", str(owner_id))
    if visibility:
        query = query.eq("visibility", visibility)
    response = query.execute()
    return response.data or []


@router.get("/{collection_id}", response_model=Collection)
def get_collection(collection_id: UUID, db: Client = Depends(get_db)):
    response = db.table("collections").select("*").eq("id", str(collection_id)).limit(1).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Collection not found")
    return rows[0]


@router.post("", response_model=Collection, status_code=status.HTTP_201_CREATED)
def create_collection(payload: CollectionCreate, db: Client = Depends(get_db)):
    to_insert = payload.model_dump(mode="json", exclude_none=True)
    response = db.table("collections").insert(to_insert, returning="representation").execute()
    data = response.data
    if isinstance(data, list):
        data = data[0] if data else None
    if not data:
        raise HTTPException(status_code=500, detail="Failed to create collection")
    return data


@router.patch("/{collection_id}", response_model=Collection)
def update_collection(collection_id: UUID, payload: CollectionUpdate, db: Client = Depends(get_db)):
    updates = payload.model_dump(mode="json", exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    response = (
        db.table("collections")
        .update(updates, returning="representation")
        .eq("id", str(collection_id))
        .execute()
    )
    data = response.data
    if isinstance(data, list):
        data = data[0] if data else None
    if not data:
        raise HTTPException(status_code=404, detail="Collection not found")
    return data


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(collection_id: UUID, db: Client = Depends(get_db)):
    response = db.table("collections").delete(returning="representation").eq("id", str(collection_id)).execute()
    if not (response.data or []):
        raise HTTPException(status_code=404, detail="Collection not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


