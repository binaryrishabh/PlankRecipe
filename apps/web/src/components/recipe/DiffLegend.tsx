// tiny color key so nobody has to guess what the highlighting means
export function DiffLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
      <span className="font-semibold text-gray-700">Legend:</span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm bg-green-200 border border-green-400" />
        added
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm bg-red-200 border border-red-400" />
        removed
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm bg-yellow-200 border border-yellow-400" />
        changed
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm bg-blue-200 border border-blue-400" />
        note
      </span>
    </div>
  );
}