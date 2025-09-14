from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from supabase import Client

from db import get_db
from db.schemas import Profile, ProfileCreate, ProfileUpdate


router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("", response_model=List[Profile])
def list_profiles(email: Optional[str] = None, db: Client = Depends(get_db)):
    query = db.table("profiles").select("*")
    if email:
        query = query.eq("email", email)
    response = query.execute()
    return response.data or []


@router.get("/{profile_id}", response_model=Profile)
def get_profile(profile_id: UUID, db: Client = Depends(get_db)):
    response = db.table("profiles").select("*").eq("id", str(profile_id)).limit(1).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Profile not found")
    return rows[0]


@router.post("", response_model=Profile, status_code=status.HTTP_201_CREATED)
def create_profile(payload: ProfileCreate, db: Client = Depends(get_db)):
    to_insert = payload.model_dump(mode="json", exclude_none=True)
    response = db.table("profiles").insert(to_insert, returning="representation").execute()
    data = response.data
    if isinstance(data, list):
        data = data[0] if data else None
    if not data:
        raise HTTPException(status_code=500, detail="Failed to create profile")
    return data


@router.patch("/{profile_id}", response_model=Profile)
def update_profile(profile_id: UUID, payload: ProfileUpdate, db: Client = Depends(get_db)):
    updates = payload.model_dump(mode="json", exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    response = (
        db.table("profiles")
        .update(updates, returning="representation")
        .eq("id", str(profile_id))
        .execute()
    )
    data = response.data
    if isinstance(data, list):
        data = data[0] if data else None
    if not data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return data


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(profile_id: UUID, db: Client = Depends(get_db)):
    response = db.table("profiles").delete(returning="representation").eq("id", str(profile_id)).execute()
    # If no rows were affected, treat as not found
    if not (response.data or []):
        raise HTTPException(status_code=404, detail="Profile not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


