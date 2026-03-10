import os
import json
from typing import List, TypedDict, Annotated
from langchain_groq import ChatGroq
from langchain_qdrant import QdrantVectorStore as Qdrant
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_core.prompts import PromptTemplate
from qdrant_client import QdrantClient
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

load_dotenv()

# --- 1. Define Graph State ---
class AgentState(TypedDict):
    question: str
    context: List[str]
    answer: str
    sources: List[dict]

# --- 2. Define Nodes ---

def retrieve(state: AgentState):
    """Retrieve relevant cricket data from Qdrant."""
    print("--- RETRIEVING CONTEXT ---")
    embeddings = HuggingFaceEndpointEmbeddings(
        huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
        model="sentence-transformers/all-MiniLM-L6-v2"
    )
    client = QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333"))
    vectorstore = Qdrant(
        client=client, 
        collection_name="cricket_matches", 
        embedding=embeddings
    )
    
    docs = vectorstore.similarity_search(state["question"], k=5)
    context = [doc.page_content for doc in docs]
    sources = [doc.metadata for doc in docs]
    
    return {"context": context, "sources": sources}

def generate(state: AgentState):
    """Generate answer using Groq LLM."""
    print("--- GENERATING ANSWER ---")
    llm = ChatGroq(
        temperature=0, 
        model_name="llama-3.1-8b-instant", # Updated from decommissioned llama3-8b-8192
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    
    prompt = f"""You are an AI Cricket Intelligence Platform. Use the context to answer.
    Context: {' '.join(state['context'])}
    Question: {state['question']}
    Answer:"""
    
    response = llm.invoke(prompt)
    return {"answer": response.content}

# --- 3. Build Graph ---

def get_cricket_app():
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("retrieve", retrieve)
    workflow.add_node("generate", generate)
    
    # Define edges
    workflow.set_entry_point("retrieve")
    workflow.add_edge("retrieve", "generate")
    workflow.add_edge("generate", END)
    
    return workflow.compile()

# For direct queries
def run_query(question: str):
    app = get_cricket_app()
    result = app.invoke({"question": question})
    return result
