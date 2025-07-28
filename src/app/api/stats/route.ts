import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import { 
  calculatePlayerStats, 
  calculateTeamStats, 
  getSortedPlayerStats, 
  getSortedTeamStats, 
  getSortedPlayerStatsByWins,
  calculateWinrate
} from '@/utils/gameStats';

// GET: 게임 통계 데이터 제공
export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // URL 파라미터에서 기간 정보 추출
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // 쿼리 조건 구성
    let query: any = {};
    
    if (startDate && endDate) {
      // 한국 시간 기준으로 날짜 범위 설정
      // startDate의 00:00:00 (한국 시간) = UTC로는 전날 15:00:00
      // endDate의 23:59:59 (한국 시간) = UTC로는 다음날 14:59:59
      const startDateTime = new Date(startDate + 'T00:00:00+09:00');
      const endDateTime = new Date(endDate + 'T23:59:59+09:00');
      
      query.createdAt = {
        $gte: startDateTime,
        $lte: endDateTime
      };
    }
    
    const games = await Game.find(query).sort({ createdAt: -1 });
    
    // 통계 계산
    const playerStats = calculatePlayerStats(games);
    const teamStats = calculateTeamStats(games);
    
    // 정렬된 통계
    const sortedPlayerStatsByWinrate = getSortedPlayerStats(playerStats);
    const sortedTeamStatsByWinrate = getSortedTeamStats(teamStats);
    const sortedPlayerStatsByWins = getSortedPlayerStatsByWins(playerStats);
    
    // 포맷팅된 통계 데이터
    const formattedPlayerWinrates = sortedPlayerStatsByWinrate.map(([player, [wins, total]], index) => ({
      rank: index + 1,
      player,
      winrate: calculateWinrate(wins, total),
      wins,
      total
    }));
    
    const formattedTeamWinrates = sortedTeamStatsByWinrate.map(([team, [wins, total]], index) => ({
      rank: index + 1,
      team,
      winrate: calculateWinrate(wins, total),
      wins,
      total
    }));
    
    const formattedPlayerWins = sortedPlayerStatsByWins.map(([player, [wins, total]], index) => ({
      rank: index + 1,
      player,
      wins,
      winrate: calculateWinrate(wins, total)
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        totalGames: games.length,
        playerWinrates: formattedPlayerWinrates,
        teamWinrates: formattedTeamWinrates,
        playerWins: formattedPlayerWins
      }
    });
  } catch (error) {
    console.error('통계 데이터 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '통계 데이터를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 