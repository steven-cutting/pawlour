<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn, userEvent, within } from 'storybook/test';

  import LightsDialog from '../src/lib/components/LightsDialog.svelte';
  import { LIGHT_CONTROLS } from '../src/lib/data/controls';
  import { expectComfortableTargets, NARROWEST_PARAMETERS } from './narrowest';

  const OVERVIEW = [
    'The two lights, behind a control of their own, in the platform `Modal`.',
    '',
    '`docs/specs/cabin.allium` — Cabin.@guarantee HerControlSaysWhatSheIsDoing: a dialog',
    'that carries the platform’s Dialog guarantees, and a toggle leaves it open so both',
    'lights can be set in one visit. Each light’s control carries “on” or “off” in its',
    'name and as a visible word, because the canvas that shows it lit is hidden from the',
    'tree (FullyKeyboardOperable).',
    '',
    'The dialog covers the viewport, so the narrow story measures its controls against',
    'the document rather than a frame.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/LightsDialog',
    component: LightsDialog,
    tags: ['autodocs'],
    parameters: {
      docs: { description: { component: OVERVIEW }, story: { inline: false } },
      layout: 'fullscreen'
    },
    args: {
      items: LIGHT_CONTROLS,
      lights: { lamp: false, strings: false },
      onselect: fn(),
      onclose: fn()
    }
  });
</script>

<Story
  name="Both off"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Lights' });
    await expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lamp, off' }));
    await expect(args.onselect).toHaveBeenCalledWith('lamp');
    await expect(args.onclose).not.toHaveBeenCalled();
    await expect(canvas.getByRole('dialog', { name: 'Lights' })).toBeInTheDocument();
  }}
/>

<Story
  name="Lamp on"
  args={{ lights: { lamp: true, strings: false } }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Lamp, on' })).toHaveTextContent('on');
    await expect(canvas.getByRole('button', { name: 'Lights, off' })).toHaveTextContent('off');
  }}
/>

<Story
  name="At the narrowest supported width"
  parameters={NARROWEST_PARAMETERS}
  play={async ({ canvasElement }) => {
    // DirectManipulation.@invariant EveryControlIsAComfortableTarget
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth
    );
    await expectComfortableTargets(canvasElement);
  }}
/>
