export const PLAYERS: string[] = ['잡', '큐', '지', '머', '웅'];

const PLAYER_ORDER_MAP = new Map<string, number>(
  PLAYERS.map((player, index) => [player, index])
);

// 팀 조합별 팀명 설정: ['지', '머'] -> '지머', ['머', '지'] -> '지머'
const TEAM_NAME_MAP_DATA: [string[], string][] = [
  [['잡', '큐'], '잡큐'],
  [['잡', '지'], '잡지'],
  [['잡', '머'], '잡머'],
  [['잡', '웅'], '잡웅'],
  [['큐', '지'], '지큐'],
  [['큐', '머'], '머큐'],
  [['큐', '웅'], '웅큐'],
  [['지', '머'], '지머'],
  [['지', '웅'], '지웅'],
  [['머', '웅'], '머웅'],
];

export function getTeamKey(team: string[]): string {
  return [...team].sort((a, b) => {
    const orderA = PLAYER_ORDER_MAP.get(a) ?? Infinity;
    const orderB = PLAYER_ORDER_MAP.get(b) ?? Infinity;
    return orderA - orderB;
  }).join('');
}

const TEAM_NAME_MAP = new Map<string, string>(
  TEAM_NAME_MAP_DATA.map(([team, name]) => [getTeamKey(team), name])
);

export function getTeamName(team: string[]): string {
  const key = getTeamKey(team);
  return TEAM_NAME_MAP.get(key) || key;
}

export function getTeamDisplayOrder(team: string[]): string[] {
  const displayName = getTeamName(team);
  const displayOrder = displayName.split('');
  return [...team].sort((a, b) => {
    const indexA = displayOrder.indexOf(a);
    const indexB = displayOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}
