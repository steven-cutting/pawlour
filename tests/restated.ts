import type { Restatement } from './platform';

/*
 * What this game restates from the platform's specifications, and where.
 *
 * `docs/specs/cabin.allium` copies four platform clauses word for word, and
 * `tests/platformSpecs.test.ts` holds each equal to the text the package ships.
 * `EveryControlIsAComfortableTarget` is an `@invariant` of the platform's
 * `contract DirectManipulation`, and the cabin restates it under a contract of
 * the same name, because its `Cabin` surface fulfils that contract and a
 * surface can only fulfil a contract declared in scope; the platform's other
 * three invariants bind it by citation. The other three clauses are guarantees
 * of the platform's `Operation` and `Appearance` surfaces, restated under
 * `Cabin`. No row needs an alias: `cabin.allium` states the two figures the
 * invariant names in its own `config`, so its text reads `config.` exactly as
 * the platform's does.
 */
export const RESTATED: readonly Restatement[] = [
  {
    module: 'operation.allium',
    theirs: 'DirectManipulation',
    file: 'cabin.allium',
    ours: 'DirectManipulation',
    alias: null,
    clauses: ['EveryControlIsAComfortableTarget']
  },
  {
    module: 'operation.allium',
    theirs: 'Operation',
    file: 'cabin.allium',
    ours: 'Cabin',
    alias: null,
    clauses: ['FullyKeyboardOperable', 'AChangeNobodyIsLookingAtIsAnnounced']
  },
  {
    module: 'appearance.allium',
    theirs: 'Appearance',
    file: 'cabin.allium',
    ours: 'Cabin',
    alias: null,
    clauses: ['ReducedMotionOverridesTheAnimationSetting']
  }
];
