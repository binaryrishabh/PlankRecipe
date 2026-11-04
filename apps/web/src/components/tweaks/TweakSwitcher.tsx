import type { Tweak } from '@shared/interface/Tweak.interface';

interface TweakSwitcherProps {
  tweaks: Tweak[];
  selectedTweakId: string | null;
  onSelect: (id: string) => void;
  onViewOriginal: () => void;
}

// the tab bar that lets you flip between the original and each community tweak
export function TweakSwitcher({
  tweaks,
  selectedTweakId,
  onSelect,
  onViewOriginal,
}: TweakSwitcherProps) {
  const safeTweaks = Array.isArray(tweaks) ? tweaks : [];

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onViewOriginal}
        className={tabClass(selectedTweakId === null)}
      >
        Original recipe
      </button>

      {safeTweaks.map((tweak, i) => {
        const active = tweak.id === selectedTweakId;
        return (
          <button
            key={tweak.id}
            type="button"
            onClick={() => onSelect(tweak.id)}
            className={tabClass(active)}
            title={tweak.text}
          >
            Tweak #{i + 1}
            {tweak.author ? (
              <span className={active ? 'text-blue-100' : 'text-gray-400'}> · {tweak.author}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function tabClass(active: boolean): string {
  return [
    'px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer',
    active
      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400',
  ].join(' ');
}