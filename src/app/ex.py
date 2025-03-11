from collections import defaultdict

# 초기 플레이어 및 팀 구성
player = {
    '잡': [0, 0],
    '큐': [0, 0],
    '지': [0, 0],
    '머': [0, 0],
    '웅': [0, 0],
}

team_stats = defaultdict(lambda: [0, 0])  # 기본값으로 [0, 0]을 가지는 딕셔너리

# 경기 기록 처리 함수
def update_stats(game_logs):
    for losing_team, winning_team in game_logs:
        # 팀 기록 업데이트
        winning_team = tuple(sorted(winning_team))
        losing_team = tuple(sorted(losing_team))

        team_stats[winning_team][0] += 1  # 승리
        team_stats[winning_team][1] += 1  # 총 경기 수 증가

        team_stats[losing_team][1] += 1  # 총 경기 수 증가

        # 플레이어 기록 업데이트
        for player_name in winning_team:
            player[player_name][0] += 1  # 승리
            player[player_name][1] += 1  # 총 경기 수 증가

        for player_name in losing_team:
            player[player_name][1] += 1  # 총 경기 수 증가

# 승률 계산 함수
def calculate_winrate(wins, total):
    return (wins / total * 100) if total > 0 else 0

# 출력 함수
def display_stats():
    print("전체 게임 수:", len(game_logs))

    print("\n개인 승률:")
    sorted_players = sorted(player.items(), key=lambda x: (calculate_winrate(x[1][0], x[1][1]), x[1][1]), reverse=True)
    for rank, (p, stats) in enumerate(sorted_players, start=1):
        winrate = calculate_winrate(stats[0], stats[1])
        print(f"{rank}위 {p}: {winrate:.2f}% (승리: {stats[0]}, 경기 수: {stats[1]})")
        
    print("\n팀 승률:")
    sorted_teams = sorted(team_stats.items(), key=lambda x: (calculate_winrate(x[1][0], x[1][1]), x[1][1]), reverse=True)
    for rank, (t, stats) in enumerate(sorted_teams, start=1):
        winrate = calculate_winrate(stats[0], stats[1])
        team_name = ''.join(t)  # 팀 이름 출력 포맷 수정
        print(f"{rank}위 팀 {team_name}: {winrate:.2f}% (승리: {stats[0]}, 경기 수: {stats[1]})")

    print("\n개인 승리 횟수 순위:")
    sorted_players_by_wins = sorted(player.items(), key=lambda x: (x[1][0], calculate_winrate(x[1][0], x[1][1])), reverse=True)
    for rank, (p, stats) in enumerate(sorted_players_by_wins, start=1):
        print(f"{rank}위 {p}: 승리 {stats[0]}회")

# 초기 경기 기록
game_logs = [
    # 패, 승
    (['잡', '큐'], ['지', '머']),
    (['잡', '큐'], ['지', '머']),
    (['머', '큐'], ['지', '잡']),
    (['잡', '큐'], ['지', '머']),
    (['잡', '큐'], ['지', '머']),
    (['잡', '머'], ['지', '큐']),
    (['머', '큐'], ['지', '잡']),
    (['머', '큐'], ['지', '잡']),
    (['지', '머'], ['웅', '잡']),
    (['머', '큐'], ['웅', '잡']),
    (['웅', '큐'], ['잡', '머']),
    (['머', '큐'], ['웅', '지']),
    (['잡', '큐'], ['웅', '지']),
    (['웅', '잡'], ['지', '큐']),
    (['잡', '머'], ['웅', '지']),
    (['머', '큐'], ['웅', '잡']),
    (['웅', '큐'], ['지', '잡']),
    (['지', '잡'], ['웅', '큐']),
    (['웅', '잡'], ['지', '큐']),
    (['웅', '지'], ['잡', '큐']),
    (['웅', '큐'], ['지', '잡']),
    (['지', '큐'], ['웅', '잡']),
    (['웅', '큐'], ['지', '잡']),
    (['웅', '큐'], ['지', '잡']),
    (['지', '큐'], ['웅', '잡']),
    (['지', '큐'], ['웅', '잡']),
    (['지', '큐'], ['웅', '잡']),
    (['웅', '지'], ['잡', '큐']),
    (['지', '큐'], ['웅', '잡']),
    (['웅', '큐'], ['지', '잡']),
    (['잡', '웅'], ['지', '큐']),
    (['웅', '큐'], ['지', '잡']),
    (['지', '잡'], ['웅', '큐']),
    (['웅', '지'], ['잡', '큐']),
    (['웅', '지'], ['잡', '큐']),
    (['지', '큐'], ['잡', '웅']),
    (['웅', '큐'], ['지', '잡']),
    (['지', '큐'], ['잡', '웅']),
    (['지', '큐'], ['잡', '웅']),
    (['잡', '큐'], ['지', '웅']),
    (['웅', '큐'], ['지', '잡']),
    (['웅', '잡'], ['지', '큐']),
    (['지', '큐'], ['웅', '잡']),
    (['지', '큐'], ['웅', '잡']),
    (['웅', '지'], ['큐', '잡']),
    (['웅', '잡'], ['지', '큐']),
    (['웅', '지'], ['잡', '큐']),
    (['웅', '지'], ['잡', '큐']),
    (['지', '잡'], ['웅', '큐']),
    # 240309
    (['지', '큐'], ['웅', '잡']),
    (['잡', '큐'], ['지', '웅']),
    (['웅', '큐'], ['지', '잡']),
    (['지', '잡'], ['머', '큐']),
    (['지', '머'], ['큐', '웅']),
    (['지', '머'], ['큐', '웅']),
    (['머', '큐'], ['지', '웅']),
    (['머', '잡'], ['큐', '웅']),
    (['머', '잡'], ['큐', '지']),
    (['큐', '웅'], ['지', '머']),
    (['지', '머'], ['웅', '큐']),
    (['잡', '웅'], ['큐', '머']),
    (['큐', '머'], ['웅', '잡']),
    (['큐', '머'], ['웅', '잡']),
    (['큐', '잡'], ['웅', '머']),
    (['머', '큐'], ['웅', '잡']),
    (['웅', '잡'], ['큐', '머']),
]

# 초기 데이터 처리
update_stats(game_logs)

# 출력
display_stats()