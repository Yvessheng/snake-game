interface ScoreDisplayProps {
  currentScore: number;
  highestScore?: number;
}

export function ScoreDisplay({ currentScore, highestScore }: ScoreDisplayProps) {
  return (
    <div style={{ textAlign: 'right', minWidth: 120 }}>
      <div style={{ fontSize: 36, fontWeight: 'bold', color: '#00FF88', lineHeight: 1 }}>
        {currentScore}
      </div>
      {highestScore !== undefined && highestScore > 0 && (
        <div style={{ fontSize: 12, color: '#8B949E', marginTop: 4 }}>
          最高: {highestScore}
        </div>
      )}
    </div>
  );
}
