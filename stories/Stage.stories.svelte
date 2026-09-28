<script module lang="ts">
  import { HeaderBar, Notice } from '@steven-cutting/biscuit-games';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { tick } from 'svelte';
  import { expect, fn, within } from 'storybook/test';

  import still from '../src/lib/assets/stills/idle.evening.webp';
  import Caption from '../src/lib/components/Caption.svelte';
  import ControlBar from '../src/lib/components/ControlBar.svelte';
  import Lockup from '../src/lib/components/Lockup.svelte';
  import PhotoButton from '../src/lib/components/PhotoButton.svelte';
  import Stage from '../src/lib/components/Stage.svelte';
  import { initialState } from '../src/lib/domain/director';
  import { expectComfortableTargets, expectNothingScrollsSideways } from './narrowest';

  const OVERVIEW = [
    'The page’s layout: the platform’s header in its shell, the room outside any shell,',
    'and the caption, the controls and the notice under it, or to its right on a phone',
    'held sideways. Decision 0016 records why the room leaves the shell.',
    '',
    'The room takes what the viewport leaves, so every story here is pinned to a viewport',
    'and measures the room against `innerWidth` and `innerHeight`, never against a frame.',
    'The room here is a still standing in for the canvas. On a phone held sideways the',
    'header stands on the left with its words out of the layout and still in the',
    'heading’s name, as the platform collapses them on a narrow phone.',
    '',
    '`docs/specs/pawlour.allium` surface Play’s EveryFigureHoldsAtTheNarrowestWidth and',
    'DirectManipulation’s EveryControlIsAComfortableTarget: nothing scrolls sideways and',
    'every control is 44px both ways at every pin. The captioned story holds that the',
    'room’s box does not move when a caption appears, which is what keeps the camera',
    'from re-framing under the reader.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/Stage',
    component: Stage,
    tags: ['autodocs'],
    render: template,
    parameters: {
      docs: { description: { component: OVERVIEW }, story: { inline: false } },
      layout: 'fullscreen'
    }
  });

  const ACTIONS = [
    { icon: 'settings', label: 'Settings', popup: 'dialog', onclick: fn() }
  ] as const;
  const SCENE = initialState('evening', 'rain', false);
  const LOCKUP = 'biscuit games / pawlour';

  /** Pinned the way `stories/narrowest.ts` pins, at any size. */
  function pinned(width: number, height: number) {
    return {
      viewport: {
        viewports: {
          pinned: {
            name: `${String(width)} × ${String(height)}`,
            styles: { width: `${String(width)}px`, height: `${String(height)}px` }
          }
        },
        defaultViewport: 'pinned'
      }
    };
  }

  /*
   * The captioned story's sentence. Module state, so its play can show and
   * clear it on the rendered page and measure the room both ways.
   */
  let caption: { text: string; sequence: number } | undefined = $state();

  /** The room's box, after the pin is checked: a play measuring a layout no phone renders proves nothing. */
  async function measure(root: HTMLElement, width: number, height: number) {
    await expect(window.innerWidth).toBe(width);
    await expect(window.innerHeight).toBe(height);
    await expectNothingScrollsSideways(root);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
    await expectComfortableTargets(root);
    // Whole and on screen: a control squeezed past its content, or clipped by a column, is not a target.
    for (const control of within(root).getAllByRole('button')) {
      const box = control.getBoundingClientRect();
      await expect(control.scrollWidth).toBeLessThanOrEqual(control.clientWidth);
      await expect(box.left).toBeGreaterThanOrEqual(0);
      await expect(box.right).toBeLessThanOrEqual(width);
    }
    return within(root).getByRole('img', { name: 'The room' }).getBoundingClientRect();
  }

  /** Where the shell's column sits at this width. */
  function shell(): { left: number; right: number } {
    const root = getComputedStyle(document.documentElement);
    const rem = parseFloat(root.fontSize);
    const max = parseFloat(root.getPropertyValue('--shell-max')) * rem;
    const width = Math.min(window.innerWidth, max);
    const left = (window.innerWidth - width) / 2;
    return { left, right: left + width };
  }
</script>

{#snippet template()}
  <div data-frame>
    <Stage>
      {#snippet header()}
        <HeaderBar actions={ACTIONS}>
          {#snippet brand()}
            <Lockup />
          {/snippet}
        </HeaderBar>
      {/snippet}
      {#snippet room()}
        <img
          alt="The room"
          src={still}
          style="display: block; inline-size: 100%; block-size: 100%; object-fit: cover"
        />
      {/snippet}
      {#snippet aside()}
        <Caption {caption} />
        <ControlBar scene={SCENE} onselect={fn()}>
          <PhotoButton oncapture={fn(async () => {})} busy={false} />
        </ControlBar>
        <Notice message={null} />
      {/snippet}
    </Stage>
  </div>
{/snippet}

<Story
  name="Phone, portrait"
  parameters={pinned(390, 844)}
  play={async ({ canvasElement }) => {
    const room = await measure(canvasElement, 390, 844);
    await expect(room.left).toBe(0);
    await expect(room.width).toBe(390);
    await expect(room.height).toBeGreaterThanOrEqual(0.6 * 844);
  }}
/>

<Story
  name="Phone, landscape"
  parameters={pinned(844, 390)}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const room = await measure(canvasElement, 844, 390);
    await expect(room.height).toBeGreaterThanOrEqual(0.85 * 390);
    await expect(room.width).toBeGreaterThanOrEqual(0.6 * 844);
    // The header on the left, the caption, the controls and the notice on the right.
    const heading = canvas.getByRole('heading', { level: 1, name: LOCKUP });
    await expect(heading.getBoundingClientRect().right).toBeLessThanOrEqual(room.left);
    for (const control of [
      canvas.getByRole('button', { name: 'Pet' }),
      canvas.getByRole('button', { name: 'Photo' }),
      ...canvas.getAllByRole('status')
    ])
      await expect(control.getBoundingClientRect().left).toBeGreaterThanOrEqual(room.right);
  }}
/>

<Story
  name="At the narrowest supported width"
  parameters={pinned(320, 568)}
  play={async ({ canvasElement }) => {
    const room = await measure(canvasElement, 320, 568);
    await expect(room.width).toBe(320);
  }}
/>

<Story
  name="Desktop"
  parameters={pinned(1200, 844)}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const room = await measure(canvasElement, 1200, 844);
    await expect(room.left).toBe(0);
    await expect(room.width).toBe(1200);
    // The chrome stays in the shell's column while the room takes the width.
    const column = shell();
    for (const element of [
      canvas.getByRole('heading', { level: 1, name: LOCKUP }),
      canvas.getByRole('button', { name: 'Settings' }),
      canvas.getByRole('button', { name: 'Pet' }),
      canvas.getByRole('button', { name: 'Photo' })
    ]) {
      const box = element.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(column.left);
      await expect(box.right).toBeLessThanOrEqual(column.right);
    }
  }}
/>

<Story
  name="Phone, portrait, as a caption comes and goes"
  parameters={pinned(390, 844)}
  play={async ({ canvasElement }) => {
    const status = within(canvasElement).getAllByRole('status')[0];
    caption = undefined;
    await tick();
    const silent = await measure(canvasElement, 390, 844);
    caption = { text: 'Biscuit has found the toy and has opinions about it.', sequence: 1 };
    await tick();
    await expect(status).toHaveTextContent('Biscuit has found the toy');
    const captioned = await measure(canvasElement, 390, 844);
    await expect(captioned.toJSON()).toEqual(silent.toJSON());
    caption = undefined;
    await tick();
  }}
/>
