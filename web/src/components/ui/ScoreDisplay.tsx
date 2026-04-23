import { theme } from '../../types/theme';

interface ScoreDisplayProps {
  currentScore: number;
  highestScore?: number;
}

export function ScoreDisplay({ currentScore, highestScore }: ScoreDisplayProps) {
  return (
    <div style={{ textAlign: 'right', minWidth: 120 }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: theme.accent.green, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {currentScore}
      </div>
      {highestScore !== undefined && highestScore > 0 && (
        <div style={{ fontSize: 11, color: theme.text.muted, marginTop: 2 }}>
          最高: {highestScore}
        </div>
      )}
    </div>
  );
}
