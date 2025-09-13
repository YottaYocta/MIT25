from fastapi import FastAPI, Depends
from supabase import Client
from db import get_db

app = FastAPI()

@app.get("/example")
def example(db: Client = Depends(get_db)):
    return db.table("profiles").select("*").execute().data
