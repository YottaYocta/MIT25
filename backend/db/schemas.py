"""
Pydantic schemas mirroring the database tables defined in schema.md.

These models are intended for request/response validation and typing when
interacting with Supabase. Field names match the column names exactly.
"""

from typing import Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Row models (represent complete rows returned from the database)
# ---------------------------------------------------------------------------


class Profile(BaseModel):
    id: UUID
    full_name: str
    email: str
    avatar_image_path: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Momento(BaseModel):
    id: UUID
    owner_id: UUID
    title: Optional[str] = None
    note: Optional[str] = None
    image_path: str
    model_path: str
    visibility: str = Field(default="public")
    taken_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Follow(BaseModel):
    follower_id: UUID
    followee_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Like(BaseModel):
    momento_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Comment(BaseModel):
    id: UUID
    momento_id: UUID
    user_id: UUID
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Collection(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    visibility: str = Field(default="public")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Create models (payloads for inserting new rows)
# ---------------------------------------------------------------------------


class ProfileCreate(BaseModel):
    id: UUID
    full_name: str
    email: Optional[str] = None
    avatar_image_path: Optional[str] = None


# ---------------------------------------------------------------------------
# Update models (payloads for partial updates)
# ---------------------------------------------------------------------------


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    avatar_image_path: Optional[str] = None


class MomentoUpdate(BaseModel):
    title: Optional[str] = None
    note: Optional[str] = None
    image_path: Optional[str] = None
    model_path: Optional[str] = None
    visibility: Optional[str] = None
    taken_at: Optional[datetime] = None


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    visibility: Optional[str] = None


class MomentoCreate(BaseModel):
    owner_id: UUID
    image_path: str
    model_path: str
    title: Optional[str] = None
    note: Optional[str] = None
    visibility: str = Field(default="public")
    taken_at: Optional[datetime] = None


class FollowCreate(BaseModel):
    follower_id: UUID
    followee_id: UUID


class LikeCreate(BaseModel):
    momento_id: UUID
    user_id: UUID


class CommentCreate(BaseModel):
    momento_id: UUID
    user_id: UUID
    body: str


class CollectionCreate(BaseModel):
    owner_id: UUID
    name: str
    visibility: str = Field(default="public")


__all__ = [
    "Profile",
    "Momento",
    "Follow",
    "Like",
    "Comment",
    "Collection",
    "ProfileCreate",
    "ProfileUpdate",
    "MomentoCreate",
    "MomentoUpdate",
    "FollowCreate",
    "LikeCreate",
    "CommentCreate",
    "CollectionCreate",
    "CollectionUpdate",
]


