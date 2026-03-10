import os
import json
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore as Qdrant
from langchain_core.documents import Document
from qdrant_client import QdrantClient
from dotenv import load_dotenv

load_dotenv()

def store_embeddings(chunks_file, collection_name):
    print(f"Loading chunks from {chunks_file}...")
    if not os.path.exists(chunks_file):
        print(f"Error: {chunks_file} not found.")
        return

    with open(chunks_file, 'r') as f:
        chunks = json.load(f)
    
    documents = [
        Document(page_content=c['page_content'], metadata=c['metadata'])
        for c in chunks
    ]
    
    print("Initializing Hugging Face embeddings...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    print(f"Connecting to Qdrant and indexing data into collection: {collection_name}...")
    
    url = os.getenv("QDRANT_URL", "http://localhost:6333")
    
    try:
        client = QdrantClient(url=url)
        
        collections = client.get_collections().collections
        exists = any(c.name == collection_name for c in collections)
        
        if exists:
            print(f"Collection {collection_name} exists. Re-creating...")
            client.delete_collection(collection_name)
        
        from qdrant_client.http import models
        client.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
        )
        
        vectorstore = Qdrant(
            client=client,
            collection_name=collection_name,
            embedding=embeddings
        )
        
        vectorstore.add_documents(documents)
        print("Success: Vector data indexed in Qdrant.")
        
    except Exception as e:
        import traceback
        print(f"Error indexing to Qdrant: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    chunks_path = os.path.join(base_dir, 'data/processed/chunks.json')
    store_embeddings(chunks_path, "cricket_matches")