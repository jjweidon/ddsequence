import React from 'react';

interface PlayerSelectProps {
  label: string;
  selectedPlayers: string[];
  oppositeTeamPlayers: string[]; // 반대 팀 선택 플레이어
  onSelectPlayer: (player: string) => void;
  compact?: boolean; // 컴팩트 모드 (모바일용)
}

const PlayerSelect: React.FC<PlayerSelectProps> = ({ 
  label, 
  selectedPlayers, 
  oppositeTeamPlayers,
  onSelectPlayer,
  compact = false
}) => {
  const players = ['잡', '큐', '지', '머', '웅'];
  
  // 플레이어 표시 이름 매핑
  const playerDisplayNames: { [key: string]: string } = {
    '잡': '채림',
    '큐': '순규',
    '지': '진호',
    '머': '희림',
    '웅': '재웅'
  };
  
  // 컴팩트 모드에서는 한 글자로 표시
  const getDisplayName = (player: string) => {
    return compact ? player : playerDisplayNames[player];
  };
  
  const isFilterMode = label === '기준' || label === '비교';
  
  return (
    <div className={`flex flex-col items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      <div className={`flex items-center gap-1 ${compact ? 'px-2 py-0.5' : 'px-3 py-1.5'} rounded-lg ${
        label === '승' 
          ? 'bg-emerald-50 dark:bg-emerald-900/30' 
          : label === '패'
          ? 'bg-rose-50 dark:bg-rose-900/30'
          : 'bg-surface-hover'
      }`}>
        <label className={`${compact ? 'text-[10px]' : 'text-sm'} font-semibold ${
          label === '승' 
            ? 'text-emerald-700 dark:text-emerald-300' 
            : label === '패'
            ? 'text-rose-700 dark:text-rose-300'
            : 'text-foreground'
        }`}>
          {label === '승' ? '승리' : label === '패' ? '패배' : label}
        </label>
      </div>
      <div className={`flex flex-wrap ${compact ? 'gap-1' : 'gap-1.5'} justify-center`}>
        {players.map((player) => {
          // 현재 팀에서 선택된 플레이어
          const isSelected = selectedPlayers.includes(player);
          // 반대 팀에서 선택된 플레이어
          const isOppositeSelected = oppositeTeamPlayers.includes(player);
          
          const buttonClasses = `
            relative overflow-hidden
            ${compact ? 'w-9 h-7 text-[10px]' : 'w-14 h-10 sm:w-16 sm:h-11 text-xs sm:text-sm'}
            rounded-lg font-semibold
            transition-all duration-200 ease-out
            ${isSelected 
              ? label === '승'
                ? 'bg-emerald-500 dark:bg-emerald-600 text-white ring-2 ring-emerald-400'
                : label === '패'
                ? 'bg-rose-500 dark:bg-rose-600 text-white ring-2 ring-rose-400'
                : 'bg-accent-gradient text-white ring-2 ring-purple-400 dark:ring-purple-500'
              : isOppositeSelected
                ? 'bg-surface-hover text-muted cursor-not-allowed opacity-50'
                : 'bg-surface text-foreground border border-border hover:bg-surface-hover'
            }
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus
          `;
          
          return (
            <button
              key={player}
              className={buttonClasses}
              onClick={() => onSelectPlayer(player)}
              disabled={isOppositeSelected}
              aria-label={`${playerDisplayNames[player]} 선택`}
            >
              {isSelected && (
                <span className="absolute inset-0 bg-white/20 animate-pulse"></span>
              )}
              <span className="relative z-10">{getDisplayName(player)}</span>
            </button>
          );
        })}
      </div>
      {!compact && (
        <div className="flex gap-1 mt-0.5">
          {[0, 1].map((index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                selectedPlayers.length > index
                  ? label === '승' ? 'bg-win scale-100' : label === '패' ? 'bg-lose scale-100' : 'bg-accent-gradient scale-100'
                  : 'bg-border-strong scale-75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerSelect; 