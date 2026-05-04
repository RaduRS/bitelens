'use client';
import { TopBar } from '@/components/layout/TopBar';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useProfile } from '@/hooks/useProfile';
import { ALLERGEN_LABELS, DIET_OPTIONS, GOAL_OPTIONS } from '@/fixtures/profile-options';
import type { AllergenKey, GoalKey } from '@/types/product';

export default function YouPage() {
  const { profile, setProfile } = useProfile();

  const toggleAllergen = (a: AllergenKey) => {
    const next = profile.allergens.includes(a)
      ? profile.allergens.filter(x => x !== a)
      : [...profile.allergens, a];
    setProfile({ ...profile, allergens: next });
  };

  const toggleGoal = (g: GoalKey) => {
    const next = profile.goals.includes(g)
      ? profile.goals.filter(x => x !== g)
      : [...profile.goals, g];
    setProfile({ ...profile, goals: next });
  };

  return (
    <div className="flex h-full flex-col overflow-auto" style={{ paddingBottom: 72 }}>
      <TopBar title="Profile" right={<div style={{ width: 36, height: 36 }} />} />

      <div className="flex flex-col gap-6 px-5 pb-6">
        <div
          className="flex items-center gap-3.5"
          style={{
            padding: 20, borderRadius: 18,
            background: 'linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 15%, var(--color-surface)) 0%, var(--color-surface) 80%)',
            border: '0.5px solid color-mix(in oklab, var(--color-accent) 30%, transparent)',
          }}
        >
          <div
            className="flex items-center justify-center font-mono font-semibold"
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'color-mix(in oklab, var(--color-accent) 24%, transparent)',
              border: '0.5px solid color-mix(in oklab, var(--color-accent) 40%, transparent)',
              color: 'var(--color-accent)', fontSize: 20,
            }}
          >YO</div>
          <div className="flex-1">
            <div className="font-semibold text-text" style={{ fontSize: 17, letterSpacing: '-0.01em' }}>You</div>
            <div className="mt-0.5 text-text-dim" style={{ fontSize: 12 }}>Personal scan profile</div>
          </div>
        </div>

        <div>
          <SectionLabel>Diet</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {DIET_OPTIONS.map(d => {
              const active = profile.diet === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setProfile({ ...profile, diet: d.id })}
                  className="cursor-pointer text-left"
                  style={{
                    padding: 12, borderRadius: 12,
                    background: active ? 'color-mix(in oklab, var(--color-accent) 14%, transparent)' : 'var(--color-surface)',
                    border: active ? '0.5px solid color-mix(in oklab, var(--color-accent) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                    color: active ? 'var(--color-accent)' : 'var(--color-text)',
                    fontSize: 14, fontWeight: 500,
                  }}
                >{d.label}</button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>Allergens to avoid</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ALLERGEN_LABELS) as AllergenKey[]).map(a => {
              const active = profile.allergens.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => toggleAllergen(a)}
                  className="cursor-pointer"
                  style={{
                    padding: '8px 14px', borderRadius: 999,
                    background: active ? 'color-mix(in oklab, var(--color-red) 14%, transparent)' : 'var(--color-surface)',
                    border: active ? '0.5px solid color-mix(in oklab, var(--color-red) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                    color: active ? 'var(--color-red)' : 'var(--color-text)',
                    fontSize: 13, fontWeight: 500,
                  }}
                >{ALLERGEN_LABELS[a]}</button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>Goals</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map(g => {
              const active = profile.goals.includes(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGoal(g.id)}
                  className="cursor-pointer"
                  style={{
                    padding: '8px 14px', borderRadius: 999,
                    background: active ? 'color-mix(in oklab, var(--color-accent) 14%, transparent)' : 'var(--color-surface)',
                    border: active ? '0.5px solid color-mix(in oklab, var(--color-accent) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                    color: active ? 'var(--color-accent)' : 'var(--color-text)',
                    fontSize: 13, fontWeight: 500,
                  }}
                >{g.label}</button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>About</SectionLabel>
          <div className="overflow-hidden bg-surface" style={{ borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Scoring methodology', detail: 'How scores work' },
              { label: 'Data sources', detail: 'Open Food Facts' },
              { label: 'Privacy', detail: 'On-device by default' },
              { label: 'Version', detail: '1.0.0' },
            ].map((row, i) => (
              <div
                key={row.label}
                className="flex items-center gap-3"
                style={{
                  padding: '14px 16px',
                  borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)',
                }}
              >
                <span className="flex-1 text-text" style={{ fontSize: 14 }}>{row.label}</span>
                <span className="text-text-dim" style={{ fontSize: 12 }}>{row.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
