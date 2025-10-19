import React from 'react';

interface PlayerSelectProps {
  label: string;
  selectedPlayers: string[];
  oppositeTeamPlayers: string[]; // 반대 팀 선택 플레이어
  onSelectPlayer: (player: string) => void;
}

const PlayerSelect: React.FC<PlayerSelectProps> = ({ 
  label, 
  selectedPlayers, 
  oppositeTeamPlayers,
  onSelectPlayer 
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
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
        label === '승' 
          ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30' 
          : 'bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/30 dark:to-red-900/30'
      }`}>
        <label className={`text-sm font-bold ${
          label === '승' 
            ? 'text-emerald-700 dark:text-emerald-300' 
            : 'text-rose-700 dark:text-rose-300'
        }`}>
          {label === '승' ? '승리' : '패배'}
        </label>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {players.map((player) => {
          // 현재 팀에서 선택된 플레이어
          const isSelected = selectedPlayers.includes(player);
          // 반대 팀에서 선택된 플레이어
          const isOppositeSelected = oppositeTeamPlayers.includes(player);
          
          const buttonClasses = `
            relative overflow-hidden
            w-14 h-10 sm:w-16 sm:h-11
            rounded-lg text-xs sm:text-sm font-semibold
            transition-all duration-200 ease-out
            ${isSelected 
              ? label === '승'
                ? 'bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 text-white shadow-md shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400 dark:ring-emerald-500'
                : 'bg-gradient-to-br from-rose-500 to-red-600 dark:from-rose-600 dark:to-red-700 text-white shadow-md shadow-rose-500/30 scale-105 ring-2 ring-rose-400 dark:ring-rose-500'
              : isOppositeSelected
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 hover:-translate-y-0.5'
            }
            ${!isSelected && !isOppositeSelected && label === '승' ? 'hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : ''}
            ${!isSelected && !isOppositeSelected && label === '패' ? 'hover:border-rose-300 dark:hover:border-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20' : ''}
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            ${label === '승' ? 'focus-visible:ring-emerald-400' : 'focus-visible:ring-rose-400'}
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
              <span className="relative z-10">{playerDisplayNames[player]}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-1 mt-0.5">
        {[0, 1].map((index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              selectedPlayers.length > index
                ? label === '승'
                  ? 'bg-emerald-500 scale-100'
                  : 'bg-rose-500 scale-100'
                : 'bg-slate-200 dark:bg-slate-700 scale-75'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerSelect; 