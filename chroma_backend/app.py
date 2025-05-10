from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Any
import os


load_dotenv()

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stored_itineraries = []

class ItineraryText(BaseModel):
    text: Any

@app.post("/store")
async def store_itinerary(item: ItineraryText):
    stored_itineraries.append(item.text)
    return {"status": "success", "message": "Itinerary stored."}

@app.get("/get-itinerary")
async def get_itinerary():
    return {"itineraries": stored_itineraries}

@app.get("/")
def root():
    return {"message": "Chroma backend running successfully"}

@app.post("/store")
def store():
    documents = [Document(page_content="Your itinerary text goes here")]

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    split_docs = splitter.split_documents(documents)

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    db = Chroma.from_documents(split_docs, embedding=embeddings, persist_directory="./chroma_db")
    db.persist()
    
    return {"status": "Success"}

