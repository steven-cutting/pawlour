<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
  import type { ComponentProps } from 'svelte';

  import ControlBar from '../src/lib/components/ControlBar.svelte';
  import PhotoButton from '../src/lib/components/PhotoButton.svelte';
  import { initialState } from '../src/lib/domain/director';
  import type { SceneState } from '../src/lib/domain/director';
  import {
    expectComfortableTargets,
    expectNothingScrollsSideways,
    FRAME_WIDTH,
    NARROWEST_PARAMETERS,
    SHELL_GUTTER
  } from './narrowest';

  type Args = ComponentProps<typeof ControlBar>;

  const DARK = { lamp: false, strings: false };
  const WALKING_TO_WATER = { spot: 'item.water.approach', item: 'water' } as const;

  function scene(overrides: Partial<SceneState> = {}): SceneState {
    return { ...initialState('night', 'snow', false), lights: DARK, ...overrides };
  }

  const OVERVIEW = [
    'The bar under the room: her, the lights, Pet, and the page’s photo control.',
    '',
    '`docs/specs/cabin.allium` — Cabin.@guarantee EveryItemIsAControl: each thing, each of',
    'the two lights, and she herself, reached from a named control outside the canvas.',
    'HerControlSaysWhatSheIsDoing: her control says what she is doing in shape and words',
    '(the paw, then the thing she is at, the hand, or an arrow and where she is heading)',
    'and is read when reached, never spoken when it changes; the things are behind it and',
    'the lights behind a control of their own, each an opener that says so; a tap on her',
    'stays one tap away. Where she is carries `aria-current` and the word “she is here”',
    'in the dialog, and each light’s state is a word on the opener and in the dialog',
    '(AppearanceNeverCarriesMeaningAlone).',
    '',
    'DirectManipulation.@invariant EveryControlIsAComfortableTarget: four controls in one',
    'row at the narrowest width, each measured at 44px both ways.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/ControlBar',
    component: ControlBar,
    tags: ['autodocs'],
    render: template,
    parameters: { docs: { description: { component: OVERVIEW } } },
    args: {
      scene: scene(),
      onselect: fn()
    }
  });
</script>

{#snippet template(args: Args)}
  <ControlBar {...args}>
    <PhotoButton oncapture={fn(async () => {})} busy={false} />
  </ControlBar>
{/snippet}

<Story
  name="On the floor"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button');
    await expect(buttons).toHaveLength(4);
    await expect(buttons[0]).toHaveAccessibleName(
      'Biscuit, standing on the floor. Send her somewhere'
    );
    await expect(buttons[1]).toHaveAccessibleName('Lights: lamp off, lights off');
    await expect(buttons[2]).toHaveAccessibleName('Pet');
    await expect(buttons[3]).toHaveAccessibleName('Photo');
    await userEvent.click(canvas.getByRole('button', { name: 'Pet' }));
    await expect(args.onselect).toHaveBeenCalledWith('biscuit');
    await expect(canvas.queryByRole('dialog')).toBeNull();
  }}
/>

<Story
  name="Walking to the water bowl"
  args={{ scene: scene({ activity: 'walk', target: WALKING_TO_WATER }) }}
  play={async ({ canvasElement }) => {
    const her = within(canvasElement).getByRole('button', { name: /^Biscuit, / });
    await expect(her).toHaveAccessibleName(
      'Biscuit, walking to the water bowl. Send her somewhere'
    );
    // The paw, the arrow, and the bowl.
    await expect(her.querySelectorAll('svg')).toHaveLength(3);
  }}
/>

<Story
  name="Asleep in the bed"
  args={{ scene: scene({ activity: 'sleep', at: 'bed' }) }}
  play={async ({ canvasElement }) => {
    const her = within(canvasElement).getByRole('button', { name: /^Biscuit, / });
    await expect(her).toHaveAccessibleName('Biscuit, asleep in the bed. Send her somewhere');
    await expect(her.querySelectorAll('svg')).toHaveLength(2);
  }}
/>

<Story
  name="Being petted"
  args={{ scene: scene({ activity: 'pet', at: 'chair' }) }}
  play={async ({ canvasElement }) => {
    const her = within(canvasElement).getByRole('button', { name: /^Biscuit, / });
    await expect(her).toHaveAccessibleName(
      'Biscuit, being petted in the chair. Send her somewhere'
    );
  }}
/>

<Story
  name="Lamp on, lights off"
  args={{ scene: scene({ lights: { lamp: true, strings: false } }) }}
  play={async ({ canvasElement }) => {
    const lights = within(canvasElement).getByRole('button', { name: /^Lights: / });
    await expect(lights).toHaveAccessibleName('Lights: lamp on, lights off');
    await expect(lights).toHaveTextContent('on');
    await expect(lights).toHaveTextContent('off');
    await expect(lights).toHaveAttribute('aria-haspopup', 'dialog');
  }}
/>

<Story
  name="Sending her somewhere"
  args={{ scene: scene({ activity: 'sleep', at: 'bed' }) }}
  play={async ({ canvasElement, args }) => {
    // H operation.allium — the Dialog guarantees, where the bar owes them:
    // the opener says so, and focus comes back to it when the dialog goes.
    const canvas = within(canvasElement);
    const her = canvas.getByRole('button', { name: /^Biscuit, / });
    await expect(her).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(her);
    const dialog = await canvas.findByRole('dialog', { name: 'Send Biscuit to' });
    await expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await expect(within(dialog).getByRole('button', { name: 'Bed, she is here' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Water' }));
    await expect(args.onselect).toHaveBeenCalledWith('water');
    await waitFor(async () => {
      await expect(canvas.queryByRole('dialog')).toBeNull();
    });
    await expect(document.activeElement).toBe(her);
  }}
/>

<Story
  name="At the narrowest supported width"
  args={{ scene: scene({ activity: 'walk', target: WALKING_TO_WATER }) }}
  parameters={NARROWEST_PARAMETERS}
  play={async ({ canvasElement }) => {
    // DirectManipulation.@invariant EveryControlIsAComfortableTarget, in the
    // bar's widest state: the paw, the arrow and the bowl, with both lights off.
    await expectNothingScrollsSideways(canvasElement);
    await expectComfortableTargets(canvasElement);
  }}
>
  {#snippet template(args)}
    <div data-frame style="inline-size: {FRAME_WIDTH}; padding-inline: {SHELL_GUTTER}">
      <ControlBar {...args}>
        <PhotoButton oncapture={fn(async () => {})} busy={false} />
      </ControlBar>
    </div>
  {/snippet}
</Story>

<Story
  name="In a narrow column"
  args={{ scene: scene({ activity: 'walk', target: WALKING_TO_WATER }) }}
  parameters={NARROWEST_PARAMETERS}
  play={async ({ canvasElement }) => {
    // The right-hand stack of a phone held sideways (`Stage`): too narrow for
    // four in a row, so two by two, each control whole and 44px both ways.
    await expectNothingScrollsSideways(canvasElement);
    await expectComfortableTargets(canvasElement);
    const buttons = within(canvasElement).getAllByRole('button');
    for (const button of buttons)
      await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
    const [her, lights, pet, photo] = buttons.map((button) => button.getBoundingClientRect());
    await expect(lights?.top).toBe(her?.top);
    await expect(photo?.top).toBe(pet?.top);
    await expect(pet?.top).toBeGreaterThan(her?.bottom ?? Infinity);
  }}
>
  {#snippet template(args)}
    <div
      data-frame
      style="inline-size: 12.5rem; padding-inline: var(--s-4); box-sizing: border-box"
    >
      <ControlBar {...args}>
        <PhotoButton oncapture={fn(async () => {})} busy={false} />
      </ControlBar>
    </div>
  {/snippet}
</Story>
