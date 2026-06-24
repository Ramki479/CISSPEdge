import { useState, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import type { DragDropItem, MatchPair, DragReorderAnswer, MatchFollowingAnswer } from '../types';

// ─── Drag to Reorder (Framer Motion Reorder) ────────────────────────────────

interface DragReorderProps {
  items: DragDropItem[];
  onChange: (orderedIds: string[]) => void;
  disabled?: boolean;
}

function DragReorder({ items, onChange, disabled }: DragReorderProps) {
  const [orderedItems, setOrderedItems] = useState<DragDropItem[]>(items);

  const handleReorder = useCallback((newOrder: DragDropItem[]) => {
    if (disabled) return;
    setOrderedItems(newOrder);
    onChange(newOrder.map(i => i.id));
  }, [disabled, onChange]);

  return (
    <Reorder.Group axis="y" values={orderedItems} onReorder={handleReorder} className="space-y-2">
      {orderedItems.map((item, idx) => (
        <Reorder.Item
          key={item.id}
          value={item}
          // Entire card is draggable — no separate handle needed
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
            disabled
              ? 'opacity-80 cursor-default border-border bg-surface-card'
              : 'cursor-grab active:cursor-grabbing border-border bg-surface-card hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5'
          } select-none`}
          style={{ touchAction: 'none' }}
          whileDrag={{
            scale: 1.03,
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.25)',
            borderColor: 'var(--color-accent)',
            backgroundColor: 'var(--color-surface-hover)',
            zIndex: 50,
            transition: { duration: 0.15 },
          }}
        >
          {/* Drag handle visual (larger + more visible) */}
          <span className="flex-shrink-0 text-text-muted text-lg min-w-[24px] min-h-[24px] flex items-center justify-center">
            ⠿
          </span>
          {/* Position number badge */}
          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-surface-alt text-text-muted text-xs font-bold min-w-[32px] min-h-[32px]">
            {idx + 1}
          </span>
          {/* Item text */}
          <span className="text-text-primary text-sm lg:text-base">{item.text}</span>
          {/* Drag hint on hover */}
          {!disabled && (
            <span className="ml-auto text-xs text-text-muted/50 group-hover:text-text-muted transition-colors hidden sm:inline">
              drag to reorder
            </span>
          )}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

// ─── Match the Following (Click-to-Match) ───────────────────────────────────

interface MatchFollowingProps {
  pairs: MatchPair[];
  onChange: (answer: MatchFollowingAnswer) => void;
  disabled?: boolean;
}

function MatchFollowing({ pairs, onChange, disabled }: MatchFollowingProps) {
  // Shuffle right items for the matching exercise
  const [shuffledRight] = useState<{ id: string; text: string }[]>(() => {
    const arr = pairs.map((p, i) => ({ id: `r-${i}`, text: p.right }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const notifyChange = (newMatches: Record<string, string>) => {
    onChange({ type: 'match-following', matches: newMatches });
  };

  const handleLeftClick = (leftText: string) => {
    if (disabled) return;

    // If already matched, unmatch (click to remove)
    if (matches[leftText]) {
      const newMatches = { ...matches };
      delete newMatches[leftText];
      setMatches(newMatches);
      notifyChange(newMatches);
      setSelectedLeft(null);
      return;
    }

    // Toggle selected state
    setSelectedLeft(prev => prev === leftText ? null : leftText);
  };

  const handleRightClick = (rightId: string) => {
    if (disabled || !selectedLeft) return;

    // If this right item is already matched to another left, remove that match first
    const newMatches = { ...matches };
    for (const [key, value] of Object.entries(newMatches)) {
      if (value === rightId) {
        delete newMatches[key];
      }
    }

    newMatches[selectedLeft] = rightId;
    setMatches(newMatches);
    notifyChange(newMatches);
    setSelectedLeft(null);
  };

  const getMatchedRightText = (leftText: string): string | null => {
    const rightId = matches[leftText];
    if (!rightId) return null;
    return shuffledRight.find(r => r.id === rightId)?.text || null;
  };

  const isAllMatched = Object.keys(matches).length === pairs.length;

  return (
    <div>
      {/* Instructions */}
      <div className="mb-4 p-3 bg-accent/10 rounded-xl border border-accent/20">
        <p className="text-sm text-accent">
          <span className="font-medium">👆 Click to match:</span> Tap a left item, then tap its matching item on the right.
        </p>
      </div>

      {/* Selection indicator */}
      {selectedLeft && !disabled && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-2 bg-accent/10 rounded-lg border border-accent/20 text-center"
        >
          <span className="text-sm text-accent">
            Selected: <strong>{selectedLeft}</strong> — now tap its match on the right
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column — items to match from */}
        <div className="space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">Items</p>
          {pairs.map((pair, idx) => {
            const matchedText = getMatchedRightText(pair.left);
            const isSelected = selectedLeft === pair.left;

            return (
              <button
                key={`left-${idx}`}
                onClick={() => handleLeftClick(pair.left)}
                disabled={disabled}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all min-h-[48px] ${
                  matchedText
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : isSelected
                      ? 'border-indigo-400 bg-indigo-500/15 ring-2 ring-indigo-500/30 scale-[1.02]'
                      : 'border-border bg-surface-card hover:border-indigo-500/50 active:scale-[0.98]'
                } ${disabled ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
              >
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-surface-alt text-text-muted text-xs font-bold min-w-[32px] min-h-[32px]">
                  {idx + 1}
                </span>
                <span className="text-text-primary text-sm flex-1">{pair.left}</span>
                {matchedText && (
                  <span className="flex-shrink-0 text-emerald-400 text-sm">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right column — match targets */}
        <div className="space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">Matches</p>
          {shuffledRight.map((item) => {
            const isMatchedTo = Object.values(matches).includes(item.id);
            const isHighlighted = selectedLeft !== null && !isMatchedTo;

            // Find which left item this right item is matched to
            const matchedLeft = Object.entries(matches).find(([, v]) => v === item.id)?.[0];

            return (
              <button
                key={item.id}
                onClick={() => handleRightClick(item.id)}
                disabled={disabled || (!selectedLeft && !isMatchedTo)}
                className={`w-full text-left p-3 rounded-xl border transition-all min-h-[48px] flex items-center gap-2 ${
                  isMatchedTo
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : isHighlighted
                      ? 'border-indigo-400/50 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-400 active:scale-[0.98]'
                      : 'border-dashed border-border bg-surface-card/50'
                } ${disabled || (!selectedLeft && !isMatchedTo) ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
              >
                {isMatchedTo ? (
                  <>
                    <span className="text-emerald-400 flex-shrink-0">✓</span>
                    <span className="text-text-primary text-sm">{item.text}</span>
                    {matchedLeft && (
                      <span className="ml-auto text-xs text-text-muted">
                        ← {matchedLeft}
                      </span>
                    )}
                  </>
                ) : (
                  <span className={`text-sm ${isHighlighted ? 'text-text-secondary' : 'text-text-muted'}`}>
                    {isHighlighted ? `Tap to match "${selectedLeft}"` : item.text}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isAllMatched && !disabled && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-emerald-400 text-sm"
        >
          ✓ All items matched! Tap "Check Answer" to verify.
        </motion.p>
      )}
    </div>
  );
}

// ─── Exports ────────────────────────────────────────────────────────────────

interface DragDropQuestionProps {
  type: 'drag-drop' | 'match-following';
  dragItems?: DragDropItem[];
  matchPairs?: MatchPair[];
  onAnswer: (answer: DragReorderAnswer | MatchFollowingAnswer) => void;
  disabled?: boolean;
}

export function DragDropQuestion({ type, dragItems, matchPairs, onAnswer, disabled }: DragDropQuestionProps) {
  if (type === 'drag-drop' && dragItems) {
    return (
      <div>
        <div className="mb-4 p-3 bg-accent/10 rounded-xl border border-accent/20">
          <p className="text-sm text-accent">
            <span className="font-medium">🖱 Drag to reorder:</span> Arrange the items in the correct order.
          </p>
        </div>
        <DragReorder
          items={dragItems}
          onChange={(orderedIds) => {
            onAnswer({ type: 'drag-reorder', orderedIds });
          }}
          disabled={disabled}
        />
      </div>
    );
  }

  if (type === 'match-following' && matchPairs) {
    return (
      <div>
        <div className="mb-4 p-3 bg-accent/10 rounded-xl border border-accent/20">
          <p className="text-sm text-accent">
            <span className="font-medium">🔗 Match the following:</span> Drag each item from the left to its matching pair on the right.
          </p>
        </div>
        <MatchFollowing
          pairs={matchPairs}
          onChange={(answer) => {
            onAnswer(answer);
          }}
          disabled={disabled}
        />
      </div>
    );
  }

  return null;
}
