// 플레이어 표시 이름 매핑
export const playerDisplayNames: { [key: string]: string } = {
  '잡': '채림',
  '큐': '순규',
  '지': '진호',
  '머': '희림',
  '웅': '재웅'
};

// 플레이어 표시 이름 가져오기
export const getPlayerDisplayName = (player: string): string => {
  return playerDisplayNames[player] || player;
};

