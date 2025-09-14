from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from supabase import Client

from db import get_db
from db.schemas import Momento, MomentoCreate, MomentoUpdate


router = APIRouter(prefix="/momentos", tags=["momentos"])


@router.get("", response_model=List[Momento])
def list_momentos(owner_id: Optional[UUID] = None, visibility: Optional[str] = None, db: Client = Depends(get_db)):
    query = db.table("momentos").select("*")
    if owner_id:
        query = query.eq("owner_id", str(owner_id))
    if visibility:
        query = query.eq("visibility", visibility)
    response = query.execute()
    return response.data or []


@router.get("/{momento_id}", response_model=Momento)
def get_momento(momento_id: UUID, db: Client = Depends(get_db)):
    response = db.table("momentos").select("*").eq("id", str(momento_id)).limit(1).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Momento not found")
    return rows[0]


@router.post("", response_model=Momento, status_code=status.HTTP_201_CREATED)
def create_momento(payload: MomentoCreate, db: Client = Depends(get_db)):
    to_insert = payload.model_dump(mode="json", exclude_none=True)
    response = db.table("momentos").insert(to_insert, returning="representation").execute()
    data = response.data
    if isinstance(data, list):
        data = data[0] if data else None
    if not data:
        raise HTTPException(status_code=500, detail="Failed to create momento")
    return data


@router.patch("/{momento_id}", response_model=Momento)
def update_momento(momento_id: UUID, payload: MomentoUpdate, db: Client = Depends(get_db)):
    updates = payload.model_dump(mode="json", exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    response = (
        db.table("momentos")
        .update(updates, returning="representation")
        .eq("id", str(momento_id))
        .execute()
    )
    data = response.data
    if isinstance(data, list):
        data = data[0] if data else None
    if not data:
        raise HTTPException(status_code=404, detail="Momento not found")
    return data


@router.delete("/{momento_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_momento(momento_id: UUID, db: Client = Depends(get_db)):
    response = db.table("momentos").delete(returning="representation").eq("id", str(momento_id)).execute()
    if not (response.data or []):
        raise HTTPException(status_code=404, detail="Momento not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


