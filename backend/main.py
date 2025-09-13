from fastapi import FastAPI, Depends
from supabase import Client
from db import get_db
from routes import profiles_router, momentos_router, collections_router

app = FastAPI()

@app.get("/example")
def example(db: Client = Depends(get_db)):
    return db.table("profiles").select("*").execute().data


app.include_router(profiles_router)
app.include_router(momentos_router)
app.include_router(collections_router)
