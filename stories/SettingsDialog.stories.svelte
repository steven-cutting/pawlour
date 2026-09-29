<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn, userEvent, within } from 'storybook/test';

  import SettingsDialog from '../src/lib/components/SettingsDialog.svelte';
  import { expectComfortableTargets, NARROWEST_PARAMETERS } from './narrowest';

  const OVERVIEW = [
    'The settings: time, sound and camera, in the platform `Modal`.',
    '',
    'H `operation.allium` — the Dialog guarantees are the `Modal`’s and are held once here',
    'by role: focus enters, Tab is held inside, Escape closes, focus returns to the opener.',
    'Inside it, `docs/specs/cabin.allium`’s TimeFollowsTheClockUntilOverridden and',
    'SoundNeverStartsUnasked, and the camera preset.',
    '',
    'The dialog covers the viewport, so the narrow story measures its controls against',
    'the document rather than a frame.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/SettingsDialog',
    component: SettingsDialog,
    tags: ['autodocs'],
    parameters: {
      docs: { description: { component: OVERVIEW }, story: { inline: false } },
      layout: 'fullscreen'
    },
    args: {
      open: true,
      onclose: fn(),
      time: 'auto',
      ontime: fn(),
      sound: false,
      onenable: fn(async () => {}),
      ondisable: fn(),
      camera: 'auto',
      oncamera: fn()
    }
  });
</script>

<Story
  name="Open"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Settings' });
    await expect(dialog).toContainElement(document.activeElement as HTMLElement);
    // Time and Camera each open on their own Auto.
    for (const name of ['Time of day', 'Camera'])
      await expect(
        within(within(dialog).getByRole('group', { name })).getByRole('radio', { name: 'Auto' })
      ).toBeChecked();
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Night' }));
    await expect(args.ontime).toHaveBeenCalledWith('night');
    await userEvent.keyboard('{Escape}');
    await expect(args.onclose).toHaveBeenCalled();
  }}
/>

<Story
  name="Held at night, sound on, from the window"
  args={{ time: 'night', sound: true, camera: 'window' }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Night' })).toBeChecked();
    await expect(canvas.getByRole('switch', { name: 'Ambient sound' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Window' })).toBeChecked();
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
    // Whole where it is painted: the camera's five segments once ran past the dialog's
    // body at 320px and were clipped, which neither figure above can see (P22).
    for (const radio of within(canvasElement).getAllByRole('radio')) {
      const box = (radio.closest('label') ?? radio).getBoundingClientRect();
      for (let clip = radio.parentElement; clip; clip = clip.parentElement) {
        if (getComputedStyle(clip).overflowX === 'visible') continue;
        const left = clip.getBoundingClientRect().left + clip.clientLeft;
        await expect(box.left).toBeGreaterThanOrEqual(left - 0.5);
        await expect(box.right).toBeLessThanOrEqual(left + clip.clientWidth + 0.5);
      }
    }
  }}
/>
