import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import SettingsDialog from '../src/lib/components/SettingsDialog.svelte';

/*
 * H operation.allium — the Dialog guarantees, answered by the platform
 * `Modal` and asserted once here through its behaviour by role: focus enters,
 * Escape closes, focus returns when it goes. Inside it, the three controls
 * cabin.allium names: the time (TimeFollowsTheClockUntilOverridden), the
 * sound switch (SoundNeverStartsUnasked) and the camera preset.
 */
function props(overrides: Partial<Parameters<typeof render<typeof SettingsDialog>>[1]> = {}) {
  return {
    open: true,
    onclose: vi.fn(),
    time: 'auto' as const,
    ontime: vi.fn(),
    sound: false,
    onenable: vi.fn().mockResolvedValue(undefined),
    ondisable: vi.fn(),
    camera: 'hearth' as const,
    oncamera: vi.fn(),
    ...overrides
  };
}

describe('SettingsDialog', () => {
  it('is nothing while closed', () => {
    render(SettingsDialog, props({ open: false }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a dialog named Settings holding the three controls', () => {
    render(SettingsDialog, props());

    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(within(dialog).getByRole('group', { name: 'Time of day' })).toBeInTheDocument();
    expect(within(dialog).getByRole('switch', { name: 'Ambient sound' })).toBeInTheDocument();
    expect(within(dialog).getByRole('group', { name: 'Camera' })).toBeInTheDocument();
  });

  it('takes focus when it opens', () => {
    render(SettingsDialog, props());

    expect(screen.getByRole('dialog', { name: 'Settings' })).toContainElement(
      document.activeElement as HTMLElement
    );
  });

  it('closes on Escape and from its Close button', async () => {
    const onclose = vi.fn();
    render(SettingsDialog, props({ onclose }));

    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onclose).toHaveBeenCalledTimes(2);
  });

  it('passes each control through to the page', async () => {
    const ontime = vi.fn();
    const oncamera = vi.fn();
    const onenable = vi.fn().mockResolvedValue(undefined);
    render(SettingsDialog, props({ ontime, oncamera, onenable }));

    await userEvent.click(screen.getByRole('radio', { name: 'Night' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Window' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Ambient sound' }));

    expect(ontime).toHaveBeenCalledWith('night');
    expect(oncamera).toHaveBeenCalledWith('window');
    expect(onenable).toHaveBeenCalledTimes(1);
  });

  it('returns focus to the opener when it closes', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { rerender } = render(SettingsDialog, props());
    expect(document.activeElement).not.toBe(opener);

    await rerender(props({ open: false }));

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
