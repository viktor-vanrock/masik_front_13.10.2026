import type { Dialogue } from '@/types';
import { DialogueItem } from './DialogueItem';

interface Props {
  dialogues: Dialogue[];
}

export const DialoguesList = ({ dialogues }: Props) => {

  return (
    <div className="space-y-3">
      {dialogues.map((dialogue) => (
        <DialogueItem key={dialogue.id} dialogue={dialogue} />
      ))}
    </div>
  );
}