from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from backend.rag_engine import run_query
from backend.analytics import CricketAnalytics
import pandas as pd
import uvicorn
import os

app = FastAPI(title="AI Cricket Match Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────── Data loader ────────────
_df_cache = None

def get_df():
    global _df_cache
    if _df_cache is None:
        csv_path = "data/processed/cleaned_ball_by_ball.csv"
        if os.path.exists(csv_path):
            _df_cache = pd.read_csv(csv_path)
    return _df_cache


# ──────────── Pydantic schemas ────────────
class QueryRequest(BaseModel):
    question: str
    model: Optional[str] = "llama-3.1-8b-instant"


class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]


# ──────────── Routes ────────────
@app.get("/")
async def root():
    return {"message": "Cricket Intelligence API is online"}


@app.post("/chat", response_model=QueryResponse)
async def chat_endpoint(request: QueryRequest):
    try:
        result = run_query(request.question)
        return QueryResponse(answer=result["answer"], sources=result["sources"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/{player_name}")
async def get_stats(player_name: str):
    try:
        df = get_df()
        if df is None:
            raise HTTPException(status_code=404, detail="Processed data not found")

        stats = CricketAnalytics.get_player_stats(player_name, df)

        if not stats.get("found"):
            all_names = df['batter'].unique().tolist()
            q = player_name.lower()
            suggestions = [n for n in all_names if q in n.lower()][:5]

            detail = f"No data found for '{player_name}'."
            if suggestions:
                detail += f" Did you mean: {', '.join(suggestions)}?"

            raise HTTPException(status_code=404, detail=detail)

        return stats

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/bowler/{player_name}")
async def get_bowler_stats_endpoint(player_name: str):
    try:
        df = get_df()
        if df is None:
            raise HTTPException(status_code=404, detail="Processed data not found")

        stats = CricketAnalytics.get_bowler_stats(player_name, df)

        if not stats.get("found"):
            all_names = df['bowler'].unique().tolist()
            q = player_name.lower()
            suggestions = [n for n in all_names if q in n.lower()][:5]

            detail = f"No bowling data found for '{player_name}'."
            if suggestions:
                detail += f" Did you mean: {', '.join(suggestions)}?"

            raise HTTPException(status_code=404, detail=detail)

        return stats

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/players/leaderboard")
async def get_leaderboard(top: int = 10, role: str = "batter"):
    """Return top N batters or bowlers from the processed dataset."""

    try:
        df = get_df()
        if df is None:
            raise HTTPException(status_code=404, detail="Processed data not found")

        # ───────── Batting Leaderboard ─────────
        if role == "batter":

            grouped = df.groupby("batter").agg(
                runs=("batsman_runs", "sum"),
                balls=("batsman_runs", "count"),
            ).reset_index()

            grouped["strike_rate"] = ((grouped["runs"] / grouped["balls"]) * 100).round(1)

            top_players = grouped.sort_values("runs", ascending=False).head(top)

            return [
                {
                    "name": r["batter"],
                    "runs": int(r["runs"]),
                    "balls": int(r["balls"]),
                    "strike_rate": float(r["strike_rate"])
                }
                for _, r in top_players.iterrows()
            ]

        # ───────── Bowling Leaderboard ─────────
        elif role == "bowler":

            bowl = df.groupby("bowler").agg(
                balls_bowled=("total_runs", "count"),
                runs_conceded=("total_runs", "sum"),
            ).reset_index()

            # Correct wicket calculation (exclude non-bowler dismissals)
            if "dismissal_kind" in df.columns:

                not_bowler_wickets = {"run out", "retired hurt", "obstructing the field"}

                wkts = (
                    df[
                        df["dismissal_kind"].notna() &
                        ~df["dismissal_kind"].isin(not_bowler_wickets)
                    ]
                    .groupby("bowler")
                    .size()
                    .reset_index(name="wickets")
                )

                bowl = bowl.merge(wkts, on="bowler", how="left").fillna(0)

            else:
                bowl["wickets"] = 0

            bowl["economy"] = ((bowl["runs_conceded"] / bowl["balls_bowled"]) * 6).round(2)

            bowl = bowl[bowl["balls_bowled"] >= 60]  # minimum 10 overs

            top_players = bowl.sort_values("wickets", ascending=False).head(top)

            return [
                {
                    "name": r["bowler"],
                    "wickets": int(r["wickets"]),
                    "economy": float(r["economy"]),
                    "balls_bowled": int(r["balls_bowled"])
                }
                for _, r in top_players.iterrows()
            ]

        else:
            raise HTTPException(status_code=400, detail="role must be 'batter' or 'bowler'")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/summary")
async def analytics_summary():
    try:
        df = get_df()

        if df is None:
            return {
                "total_matches": 0,
                "total_deliveries": 0,
                "total_players": 0,
                "seasons": []
            }

        total_deliveries = len(df)
        total_players = df["batter"].nunique()

        match_col = next((c for c in ["match_id", "id"] if c in df.columns), None)
        total_matches = df[match_col].nunique() if match_col else 0

        season_col = next((c for c in ["season", "year"] if c in df.columns), None)
        seasons = sorted(df[season_col].dropna().unique().tolist()) if season_col else []

        return {
            "total_matches": int(total_matches),
            "total_deliveries": int(total_deliveries),
            "total_players": int(total_players),
            "seasons": [str(s) for s in seasons],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)