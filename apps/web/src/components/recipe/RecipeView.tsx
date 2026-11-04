import type { Recipe } from '@shared/interface/Recipe.interface';
import type { Tweak } from '@shared/interface/Tweak.interface';
import { buildSectionDiff } from '@/lib/diff';
import { dedupeNotes } from '@/lib/notes';
import { DiffList } from './DiffList';
import { NoteCallout } from './NoteCallout';

interface RecipeViewProps {
  recipe: Recipe;
  // null here means "show the untouched original"
  tweak: Tweak | null;
}

// Renders ingredients + steps. When a tweak is passed in we light up the differences,
// otherwise every line just renders as plain unchanged text.
export function RecipeView({ recipe, tweak }: RecipeViewProps) {
  const annotations = tweak?.diff ?? [];

  const ingredientsModel = buildSectionDiff(
    recipe.ingredients,
    annotations.filter((a) => a.section === 'ingredients')
  );

  const stepsModel = buildSectionDiff(
    recipe.steps,
    annotations.filter((a) => a.section === 'steps')
  );

  // gather the freeform notes (note annotations + the interpretation fallback).
  // passing tweak.text lets dedupeNotes drop any note that just repeats the
  // review we already show in the "X said:" box — like the poker sandwiches
  // review, where the banner was literally the same paragraph twice
  const notes = dedupeNotes(
    [
      ...ingredientsModel.notes,
      ...stepsModel.notes,
      tweak?.modified.interpretationNote ?? null,
    ],
    tweak?.text
  );

  return (
    <div className="space-y-8">
      {/* notes float to the very top so they are hard to miss */}
      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((note, i) => (
            <NoteCallout key={`note-${i}`} text={note} />
          ))}
        </div>
      )}

      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Ingredients</h3>
        <DiffList rows={ingredientsModel.rows} ordered={false} emptyText="No ingredients found." />
      </section>

      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Steps</h3>
        <DiffList rows={stepsModel.rows} ordered={true} emptyText="No steps found." />
      </section>
    </div>
  );
}