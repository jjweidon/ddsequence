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
  
  return (
    <div className="flex flex-col items-center w-full gap-2">
      <label className="text-lg font-semibold">{label}</label>
      <div className="flex flex-wrap gap-2 justify-center">
        {players.map((player) => {
          // 현재 팀에서 선택된 플레이어
          const isSelected = selectedPlayers.includes(player);
          // 반대 팀에서 선택된 플레이어
          const isOppositeSelected = oppositeTeamPlayers.includes(player);
          
          return (
            <button
              key={player}
              className={`w-12 h-12 rounded-full text-xl font-bold shadow 
                transition-all duration-300 ease-in-out transform
                ${isSelected 
                  ? 'bg-indigo-600 text-white scale-110 shadow-lg' 
                  : isOppositeSelected
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
              onClick={() => onSelectPlayer(player)}
              disabled={isOppositeSelected}
            >
              {player}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerSelect; 