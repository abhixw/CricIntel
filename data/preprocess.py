import pandas as pd
import os
import json

def clean_cricket_data(raw_path, processed_path):
    print(f"Cleaning data from {raw_path}...")
    
    # Example logic for typical Kaggle cricket datasets (IPL/ODIs)
    # Expected files: deliveries.csv and matches.csv
    deliveries_file = os.path.join(raw_path, 'deliveries.csv')
    matches_file = os.path.join(raw_path, 'matches.csv')
    
    if not os.path.exists(deliveries_file) or not os.path.exists(matches_file):
        print("Required CSV files (deliveries.csv, matches.csv) not found in raw_path.")
        return

    df_deliveries = pd.read_csv(deliveries_file)
    df_matches = pd.read_csv(matches_file)

    # Basic Cleaning
    df_matches['date'] = pd.to_datetime(df_matches['date'])
    
    # Merge for context
    merged_data = pd.merge(df_deliveries, df_matches[['id', 'team1', 'team2', 'venue', 'date', 'winner']], left_on='match_id', right_on='id')
    
    # Save cleaned data
    os.makedirs(processed_path, exist_ok=True)
    merged_data.to_csv(os.path.join(processed_path, 'cleaned_ball_by_ball.csv'), index=False)
    print(f"Cleaned data saved to {processed_path}/cleaned_ball_by_ball.csv")

if __name__ == "__main__":
    clean_cricket_data('data/raw', 'data/processed')
