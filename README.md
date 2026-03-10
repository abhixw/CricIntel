# CricIntel – AI Cricket Match Intelligence Platform

CricIntel is an AI-powered cricket analytics platform that allows users to ask natural language questions about IPL matches, players, and team performance. The system uses a **Retrieval Augmented Generation (RAG)** pipeline to combine structured cricket datasets with large language models to generate intelligent insights.

The platform processes IPL match data, indexes it into a vector database, and enables users to explore analytics such as player performance, team statistics, and strategic insights through a conversational interface.

---

# Features

- AI-powered cricket analytics using IPL match datasets  
- Natural language query interface to ask questions about players, teams, and matches  
- Player performance analytics including runs, strike rate, wickets, economy rate, and averages  
- Bowling statistics and leaderboard insights  
- Retrieval-Augmented Generation (RAG) pipeline for intelligent answers  
- Fuzzy player name matching to handle variations in player names  
- FastAPI backend with structured analytics endpoints  
- Interactive React frontend dashboard  
- Vector search using Qdrant for fast retrieval  

---

# Tech Stack

## Frontend
- React  
- Vite  
- Tailwind CSS  

## Backend
- FastAPI  
- Python  

## AI / Data
- LangChain  
- LangGraph  
- Sentence Transformers  
- RAG Pipeline  

## Vector Database
- Qdrant  

## Deployment / Dev Tools
- Docker  
- Python Virtual Environment  

## Dataset
- IPL ball-by-ball and match datasets  

---

# Project Architecture

```
Sports/
│
├── backend/
│   ├── main.py
│   ├── rag_engine.py
│   ├── analytics.py
│   ├── vector_store.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── App.jsx
│   └── package.json
│
├── data/
│   ├── raw/
│   │   ├── matches.csv
│   │   └── deliveries.csv
│   ├── processed/
│   │   └── chunks.json
│   ├── preprocess.py
│   └── chunking.py
│
└── README.md
```

---

# How It Works

1. IPL datasets are cleaned and processed  
2. Data is chunked into smaller documents  
3. Embeddings are generated using sentence-transformers  
4. Embeddings are stored in Qdrant vector database  
5. User queries are processed through FastAPI  
6. The RAG pipeline retrieves relevant data from Qdrant  
7. The LLM generates an intelligent response  
8. The frontend displays insights and analytics  

---

# Installation

## Clone the repository

```bash
git clone https://github.com/yourusername/cricintel.git
cd cricintel
```

## Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate
```

## Install backend dependencies

```bash
pip install -r backend/requirements.txt
pip install sentence-transformers rapidfuzz
```

## Install frontend dependencies

```bash
cd frontend
npm install
```

---

# Running the Project

## Start the Qdrant vector database

```bash
docker run -p 6333:6333 qdrant/qdrant
```

## Index IPL data into the vector database

```bash
python backend/vector_store.py
```

## Start the backend server

```bash
uvicorn backend.main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

API documentation:

```
http://127.0.0.1:8000/docs
```

## Start the frontend

```bash
cd frontend
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# Example Questions

You can ask questions like:

- Who are the top run scorers in IPL history?  
- Which bowler has the best economy rate?  
- What is the head-to-head record between MI and CSK?  
- Who are the best death-over bowlers in IPL?  
- Which team has the highest win rate in IPL?  

---

# API Endpoints

## Players leaderboard

```
GET /players/leaderboard
```

## Player stats

```
GET /stats/player/{player_name}
```

## Bowler stats

```
GET /stats/bowler/{player_name}
```

## Analytics summary

```
GET /analytics/summary
```

## AI query endpoint

```
POST /query
```

---

# Future Improvements

- Live match analytics integration  
- Advanced predictive match models  
- Player comparison dashboard  
- Interactive match simulations  
- Real-time IPL data ingestion  

---

# License

This project is for educational and research purposes using publicly available IPL datasets.
