import type { Nutrition } from '@/types/product';

export function NutritionBlock({ nutrition }: { nutrition: Nutrition }) {
  const items = [
    { label: 'Calories', value: nutrition.kcal, unit: 'kcal', warn: false },
    { label: 'Protein',  value: nutrition.protein, unit: 'g', warn: false },
    { label: 'Carbs',    value: nutrition.carbs, unit: 'g', warn: false },
    { label: 'Sugar',    value: nutrition.sugar, unit: 'g', warn: nutrition.sugar >= 10 },
    { label: 'Fat',      value: nutrition.fat, unit: 'g', warn: false },
    { label: 'Sat. fat', value: nutrition.satFat, unit: 'g', warn: false },
    { label: 'Fiber',    value: nutrition.fiber, unit: 'g', warn: false },
    { label: 'Sodium',   value: nutrition.sodium, unit: 'mg', warn: nutrition.sodium >= 400 },
  ];
  return (
    <div>
      <div
        className="mb-2.5 font-mono uppercase text-text-dim"
        style={{ fontSize: 11, letterSpacing: '0.14em' }}
      >Per {nutrition.serving}</div>
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(2, 1fr)', gap: 1,
          background: 'rgba(255,255,255,0.05)', borderRadius: 14,
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        {items.map(it => (
          <div key={it.label} className="flex flex-col gap-1 bg-surface p-[14px]">
            <div className="text-text-dim" style={{ fontSize: 11, letterSpacing: '0.04em' }}>{it.label}</div>
            <div className="flex items-baseline gap-[3px]">
              <span
                className="font-mono"
                style={{
                  fontSize: 19, fontWeight: 500,
                  color: it.warn ? 'var(--color-amber)' : 'var(--color-text)',
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                }}
              >{it.value}</span>
              <span className="font-mono text-text-dim" style={{ fontSize: 10 }}>{it.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
