import { theme } from '../../types/theme';

interface ScoreDisplayProps {
  currentScore: number;
  highestScore?: number;
}

export function ScoreDisplay({ currentScore, highestScore }: ScoreDisplayProps) {
  return (
    <div style={{ textAlign: 'right', minWidth: 80 }}>
      <div style={{
        fontSize: 20,
        fontWeight: 700,
        color: theme.accent.green,
        lineHeight: 1,
        fontFamily: '"MS Sans Serif", "Tahoma", "SimSun", monospace',
      }}>
        {currentScore}
      </div>
      {highestScore !== undefined && highestScore > 0 && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
          最高: {highestScore}
        </div>
      )}
    </div>
  );
}
