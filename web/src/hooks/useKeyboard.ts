import { useEffect, useRef, useCallback } from 'react';

export function useKeyboard(handlers: {
  onDirection?: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onSpace?: () => void;
  onR?: () => void;
  onEscape?: () => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const h = handlersRef.current;
    const key = e.key.toLowerCase();

    // Prevent default for game keys
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'escape'].includes(key)) {
      e.preventDefault();
    }

    if (['arrowup', 'w'].includes(key)) {
      h.onDirection?.('up');
    } else if (['arrowdown', 's'].includes(key)) {
      h.onDirection?.('down');
    } else if (['arrowleft', 'a'].includes(key)) {
      h.onDirection?.('left');
    } else if (['arrowright', 'd'].includes(key)) {
      h.onDirection?.('right');
    } else if (key === ' ') {
      h.onSpace?.();
    } else if (key === 'r') {
      h.onR?.();
    } else if (key === 'escape') {
      h.onEscape?.();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
