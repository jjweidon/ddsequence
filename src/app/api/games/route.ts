import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game, { IGame } from '@/models/Game';

// GET: 모든 게임 데이터 조회
export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // URL 파라미터에서 연도 정보 추출
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    
    // 쿼리 조건 구성
    let query: any = {};
    
    if (year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        // 해당 연도의 시작일과 종료일 설정 (한국 시간 기준)
        const startDateTime = new Date(`${yearNum}-01-01T00:00:00+09:00`);
        const endDateTime = new Date(`${yearNum}-12-31T23:59:59+09:00`);
        
        query.createdAt = {
          $gte: startDateTime,
          $lte: endDateTime
        };
      }
    }
    
    const games = await Game.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: games });
  } catch (error) {
    console.error('게임 데이터 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '게임 데이터를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 게임 데이터 저장
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { winningTeam, losingTeam } = body;
    
    // 필수 필드 확인
    if (!winningTeam || !losingTeam) {
      return NextResponse.json(
        { success: false, error: '승리 팀과 패배 팀 정보가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 각 팀이 2명으로 구성되었는지 확인
    if (winningTeam.length !== 2 || losingTeam.length !== 2) {
      return NextResponse.json(
        { success: false, error: '각 팀은 정확히 2명의 플레이어로 구성되어야 합니다.' },
        { status: 400 }
      );
    }
    
    // 중복 플레이어 검사
    const allPlayers = [...winningTeam, ...losingTeam];
    const uniquePlayers = new Set(allPlayers);
    if (uniquePlayers.size !== allPlayers.length) {
      return NextResponse.json(
        { success: false, error: '승패 팀 간에 중복된 플레이어가 있습니다.' },
        { status: 400 }
      );
    }
    
    // 유효한 플레이어 검사
    const validPlayers = ['잡', '큐', '지', '머', '웅'];
    for (const player of allPlayers) {
      if (!validPlayers.includes(player)) {
        return NextResponse.json(
          { success: false, error: `유효하지 않은 플레이어: ${player}` },
          { status: 400 }
        );
      }
    }
    
    await dbConnect();
    
    const newGame = await Game.create({
      winningTeam,
      losingTeam
    });
    
    return NextResponse.json(
      { success: true, data: newGame },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('게임 데이터 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '게임 데이터를 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 모든 게임 데이터 삭제 (개발 목적)
export async function DELETE() {
  try {
    await dbConnect();
    await Game.deleteMany({});
    return NextResponse.json(
      { success: true, message: '모든 게임 데이터가 삭제되었습니다.' }
    );
  } catch (error) {
    console.error('게임 데이터 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '게임 데이터를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 