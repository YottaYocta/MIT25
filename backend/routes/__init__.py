from .profiles import router as profiles_router
from .momentos import router as momentos_router
from .collections import router as collections_router

__all__ = [
    "profiles_router",
    "momentos_router",
    "collections_router",
]


