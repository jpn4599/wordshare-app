'use client';

import { Button } from '@/components/ui/Button';
import { REACTION_EMOJIS, type Reaction } from '@/lib/types';

export function ReactionBar({
  reactions,
  userId,
  onToggle,
}: {
  reactions: Reaction[];
  userId?: string;
  onToggle: (emoji: Reaction['emoji']) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {REACTION_EMOJIS.map((emoji) => {
        const count = reactions.filter((reaction) => reaction.emoji === emoji).length;
        const active = reactions.some(
          (reaction) => reaction.emoji === emoji && reaction.user_id === userId
        );

        return (
          <Button
            key={emoji}
            type="button"
            variant={active ? 'primary' : 'secondary'}
            className="px-3 py-2 text-xs"
            onClick={() => onToggle(emoji)}
          >
            {emoji} {count}
          </Button>
        );
      })}
    </div>
  );
}
