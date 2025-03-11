import React from 'react';

interface PlayerSelectProps {
  label: string;
  selectedPlayers: string[];
  onSelectPlayer: (player: string) => void;
}

const PlayerSelect: React.FC<PlayerSelectProps> = ({ 
  label, 
  selectedPlayers, 
  onSelectPlayer 
}) => {
  const players = ['잡', '큐', '지', '머', '웅'];
  
  return (
    <div className="flex flex-col items-center w-full gap-2">
      <label className="text-lg font-semibold">{label}</label>
      <div className="flex flex-wrap gap-2 justify-center">
        {players.map((player) => (
          <button
            key={player}
            className={`w-12 h-12 rounded-full text-xl font-bold shadow 
              ${selectedPlayers.includes(player) 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'}`}
            onClick={() => onSelectPlayer(player)}
            disabled={selectedPlayers.includes(player)}
          >
            {player}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlayerSelect; 