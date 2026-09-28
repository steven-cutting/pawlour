<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn, userEvent, within } from 'storybook/test';

  import SendDialog from '../src/lib/components/SendDialog.svelte';
  import { SEND_CONTROLS } from '../src/lib/data/controls';
  import { expectComfortableTargets, NARROWEST_PARAMETERS } from './narrowest';

  const OVERVIEW = [
    'The things she can be sent to, behind her control, in the platform `Modal`.',
    '',
    '`docs/specs/cabin.allium` — Cabin.@guarantee HerControlSaysWhatSheIsDoing: a dialog',
    'that carries the platform’s Dialog guarantees (H `operation.allium`: focus enters, Tab',
    'is held inside, Escape closes, focus returns to the opener), and choosing a thing',
    'closes it at once. Where she is carries `aria-current` and the word “she is here”,',
    'never the fill alone (AppearanceNeverCarriesMeaningAlone).',
    '',
    'The dialog covers the viewport, so the narrow story measures its controls against',
    'the document rather than a frame.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/SendDialog',
    component: SendDialog,
    tags: ['autodocs'],
    parameters: {
      docs: { description: { component: OVERVIEW }, story: { inline: false } },
      layout: 'fullscreen'
    },
    args: {
      items: SEND_CONTROLS,
      at: 'floor',
      onselect: fn(),
      onclose: fn()
    }
  });
</script>

<Story
  name="Open, she is on the floor"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Send Biscuit to' });
    await expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await expect(canvas.queryAllByRole('button', { current: true })).toHaveLength(0);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Water' }));
    await expect(args.onselect).toHaveBeenCalledWith('water');
    await expect(args.onclose).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Escape}');
    await expect(args.onclose).toHaveBeenCalledTimes(2);
  }}
/>

<Story
  name="She is at the bed"
  args={{ at: 'bed' }}
  play={async ({ canvasElement }) => {
    const bed = within(canvasElement).getByRole('button', { name: 'Bed, she is here' });
    await expect(bed).toHaveAttribute('aria-current', 'true');
  }}
/>

<Story
  name="At the narrowest supported width"
  args={{ at: 'chair' }}
  parameters={NARROWEST_PARAMETERS}
  play={async ({ canvasElement }) => {
    // DirectManipulation.@invariant EveryControlIsAComfortableTarget
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth
    );
    await expectComfortableTargets(canvasElement);
  }}
/>
