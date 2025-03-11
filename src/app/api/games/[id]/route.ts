import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import mongoose from 'mongoose';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const id = params.id;
    
    // ID 유효성 검사
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 게임 ID입니다.' },
        { status: 400 }
      );
    }
    
    // 데이터베이스에서 게임 기록 삭제
    const deletedGame = await Game.findByIdAndDelete(id);
    
    // 삭제할 게임이 없는 경우
    if (!deletedGame) {
      return NextResponse.json(
        { error: '해당 ID의 게임을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: '게임 기록이 성공적으로 삭제되었습니다.' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('게임 기록 삭제 오류:', error);
    return NextResponse.json(
      { error: '서버 오류로 게임 기록을 삭제할 수 없습니다.' },
      { status: 500 }
    );
  }
} 