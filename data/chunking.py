import pandas as pd
import os
from langchain_core.documents import Document

def create_chunks(processed_file, output_path):
    print(f"Creating chunks from {processed_file}...")
    df = pd.read_csv(processed_file)
    
    # Group by match and over to create logical summaries
    match_summaries = []
    
    grouped = df.groupby(['match_id', 'inning', 'batting_team', 'bowling_team'])
    
    for (match_id, inning, batting_team, bowling_team), group in grouped:
        # Create a summary of the inning/match
        venue = group['venue'].iloc[0]
        date = group['date'].iloc[0]
        
        # Aggregate performance
        total_runs = group['total_runs'].sum()
        wickets = group['is_wicket'].sum()
        
        text_content = (
            f"Match ID {match_id} on {date} at {venue}. "
            f"Inning {inning}: {batting_team} vs {bowling_team}. "
            f"Total Score: {total_runs}/{wickets}. "
        )
        
        # Add player specific highlights (Top scorers)
        top_scorers = group.groupby('batter')['batsman_runs'].sum().sort_values(ascending=False).head(3)
        highlights = ", ".join([f"{name} ({runs} runs)" for name, runs in top_scorers.items()])
        text_content += f"Top Batsmen: {highlights}. "
        
        doc = {
            "page_content": text_content,
            "metadata": {
                "match_id": int(match_id),
                "inning": int(inning),
                "teams": f"{batting_team} vs {bowling_team}",
                "venue": venue,
                "date": str(date)
            }
        }
        match_summaries.append(doc)
    
    # Save as JSON for verification
    os.makedirs(output_path, exist_ok=True)
    with open(os.path.join(output_path, 'chunks.json'), 'w') as f:
        json.dump(match_summaries, f, indent=2)
        
    print(f"Generated {len(match_summaries)} logical chunks.")

import json
if __name__ == "__main__":
    create_chunks('data/processed/cleaned_ball_by_ball.csv', 'data/processed')
