import type { DisplayRow, RowStatus } from '@/lib/diff';

interface DiffRowProps {
  row: DisplayRow;
  // the bullet or step number we show in the left gutter
  marker: string;
}

const toneMap: Record<RowStatus, string> = {
  added: 'bg-green-50 border-green-200',
  removed: 'bg-red-50 border-red-200',
  changed: 'bg-yellow-50 border-yellow-200',
  unchanged: 'bg-white border-gray-100',
};

// one single line of the recipe, tinted by how it was changed
export function DiffRow({ row, marker }: DiffRowProps) {
  return (
    <li className={`flex items-start gap-3 px-3 py-2 rounded-md border ${toneMap[row.status]}`}>
      <span className="w-6 shrink-0 text-right text-sm text-gray-400 select-none mt-0.5">
        {marker}
      </span>
      <div className="flex-1 text-sm leading-relaxed">{renderContent(row)}</div>
    </li>
  );
}

function renderContent(row: DisplayRow) {
  switch (row.status) {
    case 'added':
      return (
        <span className="text-green-800">
          <span className="font-bold select-none" aria-hidden="true">
            +{' '}
          </span>
          {row.text}
        </span>
      );

    case 'removed':
      return <span className="text-red-700 line-through decoration-red-400">{row.text}</span>;

    case 'changed':
      return (
        <span>
          <span className="text-red-700 line-through decoration-red-400">{row.before}</span>
          <span className="mx-2 text-gray-400 select-none" aria-hidden="true">
            →
          </span>
          <span className="text-green-800 font-medium">{row.text}</span>
        </span>
      );

    default:
      return <span className="text-gray-800">{row.text}</span>;
  }
}