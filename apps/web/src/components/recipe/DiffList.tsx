import type { DisplayRow } from '@/lib/diff';
import { DiffRow } from './DiffRow';

interface DiffListProps {
  rows: DisplayRow[];
  // steps are numbered, ingredients just get a bullet
  ordered: boolean;
  emptyText: string;
}

export function DiffList({ rows, ordered, emptyText }: DiffListProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 italic px-1 py-2">{emptyText}</p>;
  }

  // we number only the steps that actually survive, removed ones dont eat a number
  let stepNumber = 0;

  return (
    <ul className="space-y-1.5">
      {rows.map((row) => {
        let marker: string;
        if (!ordered) {
          marker = '•';
        } else if (row.status === 'removed') {
          marker = '–';
        } else {
          stepNumber += 1;
          marker = `${stepNumber}.`;
        }
        return <DiffRow key={row.key} row={row} marker={marker} />;
      })}
    </ul>
  );
}