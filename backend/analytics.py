from rapidfuzz import process


def find_player_name(input_name, player_list):
    match, score, _ = process.extractOne(input_name, player_list)
    if score > 70:
        return match
    return None


def calculate_strike_rate(runs, balls):
    if balls == 0:
        return 0.0
    return round((runs / balls) * 100, 2)


def calculate_economy_rate(runs, balls):
    if balls == 0:
        return 0.0
    overs = balls / 6
    return round(runs / overs, 2)


def calculate_win_probability(team1_score, team2_score, overs_remaining, target):
    if team1_score >= target:
        return 1.0
    return 0.5


class CricketAnalytics:

    @staticmethod
    def get_player_stats(player_name, df):

        players = df['batter'].dropna().unique().tolist()
        matched_name = find_player_name(player_name, players)

        if not matched_name:
            return {"runs": 0, "balls": 0, "strike_rate": 0.0, "found": False}

        player_df = df[df['batter'] == matched_name]

        runs = player_df['batsman_runs'].sum()
        balls = len(player_df)
        sr = calculate_strike_rate(runs, balls)

        return {
            "name": matched_name,
            "runs": int(runs),
            "balls": int(balls),
            "strike_rate": float(sr),
            "found": True
        }

    @staticmethod
    def get_bowler_stats(player_name, df):

        bowlers = df['bowler'].dropna().unique().tolist()
        matched_name = find_player_name(player_name, bowlers)

        if not matched_name:
            return {"found": False}

        bowl_df = df[df['bowler'] == matched_name]

        balls = len(bowl_df)
        runs_conceded = int(bowl_df['total_runs'].sum())
        economy = calculate_economy_rate(runs_conceded, balls)
        overs = round(balls / 6, 1)

        wickets = 0
        if 'dismissal_kind' in df.columns:
            not_bowler_wickets = {'run out', 'retired hurt', 'obstructing the field'}
            wickets = int(bowl_df['dismissal_kind'].notna().sum()) - \
                      int(bowl_df[bowl_df['dismissal_kind'].isin(not_bowler_wickets)].shape[0])

        average = round(runs_conceded / wickets, 2) if wickets > 0 else None

        return {
            "name": matched_name,
            "wickets": int(wickets),
            "balls_bowled": int(balls),
            "overs": float(overs),
            "runs_conceded": runs_conceded,
            "economy": float(economy),
            "average": float(average) if average else None,
            "found": True
        }
