import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Penalty from '@/models/Penalty';

// DELETE: 특정 패널티 데이터 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const penalty = await Penalty.findByIdAndDelete(id);
    
    if (!penalty) {
      return NextResponse.json(
        { success: false, error: '패널티를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: '패널티가 삭제되었습니다.' }
    );
  } catch (error: any) {
    console.error('패널티 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '패널티를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
