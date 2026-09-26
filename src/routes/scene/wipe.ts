const CLOSED = 'polygon(0 0, 0 0, 0 0, 0 0, 0 0)';
const OPEN = 'polygon(0 0, 200% 0, 200% 0, 0 200%, 0 200%)';
const pending = new WeakMap<HTMLElement, () => void>();

/** A CSS-token gated sweep. The page owns its element and when to remove it. */
export function wipe(element: HTMLElement, direction: 'in' | 'out'): Promise<void> {
  pending.get(element)?.();
  return new Promise((resolve) => {
    const previous = element.style.transition;
    const done = (): void => {
      element.removeEventListener('transitionend', ended);
      element.removeEventListener('transitioncancel', ended);
      element.style.transition = previous;
      pending.delete(element);
      resolve();
    };
    const ended = (event: TransitionEvent): void => {
      if (event.target === element && event.propertyName === 'clip-path') done();
    };
    pending.set(element, done);
    element.style.transition = 'none';
    element.style.clipPath = direction === 'in' ? CLOSED : OPEN;
    // Commit the start style without scheduling another animation loop.
    element.getBoundingClientRect();
    element.style.transition = 'clip-path var(--dur-3) var(--ease)';
    element.addEventListener('transitionend', ended);
    element.addEventListener('transitioncancel', ended);
    element.style.clipPath = direction === 'in' ? OPEN : CLOSED;
    const style = element.ownerDocument.defaultView?.getComputedStyle(element);
    const duration = style?.getPropertyValue('--dur-3').trim() || style?.transitionDuration || '0s';
    if (duration.split(',').every((part) => Number.parseFloat(part) === 0)) done();
  });
}
