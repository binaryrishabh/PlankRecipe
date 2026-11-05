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
              <span className={active ? 'text-cream-300' : 'text-ink-500'}> · {tweak.author}</span>
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
      ? 'bg-ink-900 text-cream-50 border-ink-900 shadow-sm'
      : 'bg-cream-50 text-ink-700 border-cream-300 hover:bg-white hover:border-ink-500',
  ].join(' ');
}