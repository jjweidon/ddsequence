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
    <div className="flex flex-col items-center w-full gap-2">
      <label className={`text-lg font-semibold ${label === '승' ? 'text-green-700' : 'text-red-700'}`}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2 justify-center">
        {players.map((player) => {
          // 현재 팀에서 선택된 플레이어
          const isSelected = selectedPlayers.includes(player);
          // 반대 팀에서 선택된 플레이어
          const isOppositeSelected = oppositeTeamPlayers.includes(player);
          
          const baseClasses = "w-16 h-10 rounded-lg text-lg font-bold shadow";
          const transitionClasses = "transition-[transform,background-color,box-shadow] duration-300 ease-in-out";
          
          const buttonClasses = `${baseClasses} ${transitionClasses} ${
            isSelected 
              ? label === '승'
                ? 'bg-green-600 text-white scale-110 shadow-lg hover:bg-green-700 border-0'
                : 'bg-red-600 text-white scale-110 shadow-lg hover:bg-red-700 border-0'
              : isOppositeSelected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60 border-0'
                : label === '승'
                  ? 'bg-white text-gray-700 hover:bg-green-50'
                  : 'bg-white text-gray-700 hover:bg-red-50'
          }`;
          
          return (
            <button
              key={player}
              className={buttonClasses}
              onClick={() => onSelectPlayer(player)}
              disabled={isOppositeSelected}
              style={{
                borderWidth: isSelected ? 0 : '1px',
                borderStyle: 'solid',
                borderColor: isSelected ? 'transparent' : (label === '승' ? '#86efac' : '#fca5a5')
              }}
            >
              {playerDisplayNames[player]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerSelect; 