<script lang="ts">
  import {
    HeaderBar,
    Notice,
    animationsActive,
    createMediaPreferences
  } from '@steven-cutting/biscuit-games';
  import { onMount } from 'svelte';

  import biscuitUrl from '$lib/assets/biscuit.glb?url';
  import clips from '$lib/assets/biscuit.clips.json';
  import cabinUrl from '$lib/assets/cabin.glb?url';
  import fire from '$lib/assets/audio/fire.mp3';
  import lapping from '$lib/assets/audio/lapping.mp3';
  import rain from '$lib/assets/audio/rain.mp3';
  import squeak from '$lib/assets/audio/squeak.mp3';
  import wind from '$lib/assets/audio/wind.mp3';
  import idleMorning from '$lib/assets/stills/idle.morning.webp';
  import idleEvening from '$lib/assets/stills/idle.evening.webp';
  import idleNight from '$lib/assets/stills/idle.night.webp';
  import sleepBedMorning from '$lib/assets/stills/sleep.bed.morning.webp';
  import sleepBedEvening from '$lib/assets/stills/sleep.bed.evening.webp';
  import sleepBedNight from '$lib/assets/stills/sleep.bed.night.webp';
  import sleepChairMorning from '$lib/assets/stills/sleep.chair.morning.webp';
  import sleepChairEvening from '$lib/assets/stills/sleep.chair.evening.webp';
  import sleepChairNight from '$lib/assets/stills/sleep.chair.night.webp';
  import drinkMorning from '$lib/assets/stills/drink.morning.webp';
  import drinkEvening from '$lib/assets/stills/drink.evening.webp';
  import drinkNight from '$lib/assets/stills/drink.night.webp';
  import eatMorning from '$lib/assets/stills/eat.morning.webp';
  import eatEvening from '$lib/assets/stills/eat.evening.webp';
  import eatNight from '$lib/assets/stills/eat.night.webp';
  import playMorning from '$lib/assets/stills/play.morning.webp';
  import playEvening from '$lib/assets/stills/play.evening.webp';
  import playNight from '$lib/assets/stills/play.night.webp';
  import { GAME_DESCRIPTION, GAME_TITLE } from '$lib/brand';
  import Caption from '$lib/components/Caption.svelte';
  import ItemControls from '$lib/components/ItemControls.svelte';
  import Lockup from '$lib/components/Lockup.svelte';
  import PhotoButton from '$lib/components/PhotoButton.svelte';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import TitleCard from '$lib/components/TitleCard.svelte';
  import { cueFor } from '$lib/cues';
  import { ITEM_CONTROLS } from '$lib/data/controls';
  import { drawsTheSame } from '$lib/drawn';
  import { initialState, step } from '$lib/domain/director';
  import type { Camera, Command, SceneState } from '$lib/domain/director';
  import type { Item } from '$lib/domain/items';
  import { phaseAt } from '$lib/domain/phases';
  import type { Phase } from '$lib/domain/phases';
  import { CLOCK_INTERVAL_MS, TICK_MS } from '$lib/domain/timing';
  import { chooseWeather } from '$lib/domain/weather';
  import { composePhoto } from '$lib/photo';
  import type { Ports } from '$lib/ports';
  import { createWebAudio } from '$lib/ports/audio';
  import { createSystemClock } from '$lib/ports/clock';
  import { createAnimationFrames } from '$lib/ports/frame';
  import type { FramePort } from '$lib/ports/frame';
  import { createCryptoRandom } from '$lib/ports/random';
  import { createWebStorage } from '$lib/ports/storage';
  import { createIntervalTimer } from '$lib/ports/timer';
  import { describeScene } from '$lib/sentence';
  import type { Hit } from './scene/hit';
  import type { SceneAssets } from './scene/scene';
  import SceneCanvas from './scene/SceneCanvas.svelte';
  import { stillFor } from './scene/still';
  import type { StillKey } from './scene/still';

  /*
   * The whole application, assembled: the platform's chrome carrying this
   * game's lockup, the room, the sentence that says it in words, the caption,
   * the row of controls, the photo, and the settings dialog (CONVENTIONS.md §7).
   *
   * Everything that differs per visitor — the stored phase and camera, the
   * device's preferences, the clock, the audio — belongs after hydration,
   * inside `onMount`: `+layout.ts` prerenders every route, so module-scope
   * work here runs once in Node at build time. Every port is constructed
   * there and nowhere else, and handed down as props; `ports` is the one
   * prop, taken by the route test to inject the fakes, and absent in the app.
   *
   * The director's state is one `$state.raw`: `step` returns a new object
   * each time and nothing here mutates one, so a proxy would only cost.
   * Every command goes through `dispatch`, which also hands the audio port
   * the difference between the old state and the new (`cues.ts`).
   *
   * Every selector below names an element or a class this markup carries,
   * because `svelte-check --fail-on-warnings` turns an unused selector into a
   * failed gate.
   */

  // eslint-disable-next-line svelte/valid-prop-names-in-kit-pages -- the route test injects the fakes here; SvelteKit passes nothing, so the real ports are built in onMount
  let { ports }: { ports?: Ports } = $props();

  /** How long "Saved" holds over the room; the sweep itself runs on `--dur-3`. */
  const SAVED_MS = 1_500;
  const PHASES: readonly Phase[] = ['morning', 'evening', 'night'];
  const CAMERAS: readonly Camera[] = ['hearth', 'window', 'chair'];
  const ITEMS: readonly Item[] = ['bed', 'chair', 'water', 'food', 'toy', 'lamp', 'lights'];
  const SOUNDS = { fire, rain, wind, lapping, squeak };
  const STILLS: Readonly<Record<StillKey, string>> = {
    'idle.morning': idleMorning,
    'idle.evening': idleEvening,
    'idle.night': idleNight,
    'sleep.bed.morning': sleepBedMorning,
    'sleep.bed.evening': sleepBedEvening,
    'sleep.bed.night': sleepBedNight,
    'sleep.chair.morning': sleepChairMorning,
    'sleep.chair.evening': sleepChairEvening,
    'sleep.chair.night': sleepChairNight,
    'drink.morning': drinkMorning,
    'drink.evening': drinkEvening,
    'drink.night': drinkNight,
    'eat.morning': eatMorning,
    'eat.evening': eatEvening,
    'eat.night': eatNight,
    'play.morning': playMorning,
    'play.evening': playEvening,
    'play.night': playNight
  };
  const ASSETS: SceneAssets = {
    biscuit: biscuitUrl,
    cabin: cabinUrl,
    clips,
    still: (state) => STILLS[stillFor(state)]
  };
  /** Before the ports exist the canvas has nothing to draw with; this never fires. */
  const IDLE_FRAMES: FramePort = { each: () => () => undefined };

  let live: Ports | undefined = $state.raw();
  let scene: SceneState = $state.raw(initialState('morning', 'clear', false));
  let settingsOpen = $state(false);
  let card: 'hidden' | 'loading' | 'photo' = $state('hidden');
  let progress = $state(0);
  let everReady = false;
  let busy = $state(false);
  let photos = $state(0);
  let photoNotice: string | null = $state(null);
  let photoFailures = $state(0);
  /** What the canvas exports to the page (P07a); named here because a component import is untyped to the linter. */
  interface Canvas {
    capture(): string;
    forceContextRestore(): void;
  }
  let canvas: Canvas | undefined = $state();
  let stopSaved: (() => void) | undefined;

  const frames = $derived(live?.frames ?? IDLE_FRAMES);
  const time = $derived<Phase | 'auto'>(scene.phaseOverride ?? 'auto');

  // The runtime draws once per state it is handed, and every tick returns a
  // new one. MotionOffIsAStillDiorama: the canvas gets the previous state back
  // whenever nothing it draws has changed, so a still is drawn once per change.
  let drawn: SceneState | undefined;
  const picture = $derived.by(() => {
    if (drawn === undefined || !drawsTheSame(drawn, scene)) drawn = scene;
    return drawn;
  });

  const ACTIONS = [
    {
      icon: 'settings',
      label: 'Settings',
      popup: 'dialog',
      onclick: () => {
        settingsOpen = true;
      }
    }
  ] as const;

  function isPhase(value: string | null): value is Phase {
    return PHASES.some((phase) => phase === value);
  }
  function isCamera(value: string | null): value is Camera {
    return CAMERAS.some((camera) => camera === value);
  }
  function isItem(value: string): value is Item {
    return ITEMS.some((item) => item === value);
  }

  function dispatch(command: Command): void {
    const p = live;
    if (!p) return;
    const previous = scene;
    scene = step(previous, command, { random: p.random });
    const cue = cueFor(previous, scene);
    if (cue.bed) p.audio.setBed(cue.bed);
    for (const name of cue.play ?? []) p.audio.play(name);
  }

  // The row and the canvas issue identical commands: she is `tapBiscuit`, a
  // thing is `tap`, the floor is only somewhere to look.
  function select(id: Item | 'biscuit'): void {
    dispatch(id === 'biscuit' ? { kind: 'tapBiscuit' } : { kind: 'tap', item: id });
  }
  function tapped(hit: Hit): void {
    if (hit.kind === 'biscuit') {
      dispatch({ kind: 'tapBiscuit' });
    } else if (hit.kind === 'floor') {
      dispatch({ kind: 'tapFloor', point: hit.point });
    } else {
      // The room names twelve things; the director knows seven. The rest wait for v1.1.
      const name = hit.item.replace(/^item\./, '');
      if (isItem(name)) dispatch({ kind: 'tap', item: name });
    }
  }

  function chooseTime(value: Phase | 'auto'): void {
    const p = live;
    if (!p) return;
    dispatch({ kind: 'setPhase', phase: value });
    if (value === 'auto') {
      // Clearing the override leaves the phase where it was until the next
      // reading; the clock is read now so the room follows it at once.
      dispatch({ kind: 'clockPhase', phase: phaseAt(p.clock.now()) });
      p.storage.remove('pawlour.time');
    } else {
      p.storage.write('pawlour.time', value);
    }
  }
  function chooseCamera(camera: Camera): void {
    dispatch({ kind: 'setCamera', camera });
    live?.storage.write('pawlour.camera', camera);
  }

  // SoundNeverStartsUnasked: `enable()` is reached from the switch's change
  // handler and nowhere else, and `sound` turns on only once it has resolved,
  // so no cue can reach a port that has not started.
  async function enableSound(): Promise<void> {
    const p = live;
    if (!p) return;
    await p.audio.enable();
    dispatch({ kind: 'setSound', on: true });
  }
  function disableSound(): void {
    live?.audio.disable();
    dispatch({ kind: 'setSound', on: false });
  }

  function token(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve(image);
      };
      image.onerror = () => {
        reject(new Error('The captured frame could not be read'));
      };
      image.src = source;
    });
  }

  /**
   * Photo mode. The canvas renders once and hands back a PNG; the card is
   * composed in `photo.ts` and drawn over it here; the download is a link the
   * page makes and removes. The director is sent nothing: a walk or a pet in
   * progress is what the picture shows.
   */
  async function photograph(): Promise<void> {
    const p = live;
    if (!p || !canvas) return;
    busy = true;
    try {
      const shot = await loadImage(canvas.capture());
      const sheet = document.createElement('canvas');
      sheet.width = shot.naturalWidth;
      sheet.height = shot.naturalHeight;
      const context = sheet.getContext('2d');
      if (!context) throw new Error('No drawing context for the card');
      context.drawImage(shot, 0, 0);
      const { panels, texts } = composePhoto({
        width: sheet.width,
        height: sheet.height,
        caption: scene.caption?.text,
        phase: scene.phase
      });
      for (const panel of panels) {
        context.fillStyle = token(`--overlay-${panel.fill}`);
        context.beginPath();
        panel.points.forEach((point, index) => {
          if (index === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        });
        context.closePath();
        context.fill();
      }
      for (const text of texts) {
        const family = token(text.font === 'display' ? '--font-display' : '--font-ui');
        context.font = `${text.font === 'display' ? '700' : '500'} ${String(text.size)}px ${family}`;
        context.fillStyle = token(`--overlay-${text.ink}`);
        context.textAlign = text.align;
        context.textBaseline = 'alphabetic';
        context.fillText(text.text, text.x, text.y);
      }
      photos += 1;
      const link = document.createElement('a');
      link.href = sheet.toDataURL('image/png');
      link.download = `pawlour-${scene.phase}-${String(photos)}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      card = 'photo';
      stopSaved?.();
      stopSaved = p.timer.every(SAVED_MS, () => {
        stopSaved?.();
        stopSaved = undefined;
        card = 'hidden';
      });
    } catch {
      photoFailures += 1;
      photoNotice = 'The room could not be photographed.';
    } finally {
      busy = false;
    }
  }

  function realPorts(): Ports {
    return {
      storage: createWebStorage(),
      clock: createSystemClock(),
      random: createCryptoRandom(),
      timer: createIntervalTimer(),
      frames: createAnimationFrames(),
      audio: createWebAudio(SOUNDS),
      preferences: createMediaPreferences()
    };
  }

  onMount(() => {
    const p = ports ?? realPorts();
    live = p;
    const deps = { random: p.random };

    // The room as it opens: the clock's phase unless a stored choice holds it,
    // the weather drawn once for the visit, motion as the device allows, and
    // the stored camera. Sound is never read back (SoundNeverStartsUnasked).
    let opening = initialState(
      phaseAt(p.clock.now()),
      chooseWeather(p.random),
      animationsActive(true, p.preferences.prefersReducedMotion())
    );
    const storedTime = p.storage.read('pawlour.time');
    if (isPhase(storedTime)) opening = step(opening, { kind: 'setPhase', phase: storedTime }, deps);
    const storedCamera = p.storage.read('pawlour.camera');
    if (isCamera(storedCamera)) {
      opening = step(opening, { kind: 'setCamera', camera: storedCamera }, deps);
    }
    scene = opening;

    // `data-animations` is the only selector under which the platform's
    // `--dur-*` tokens are anything but 0ms, and the device's reduced-motion
    // preference wins over it whatever the game sets.
    const applyMotion = (): void => {
      const active = animationsActive(true, p.preferences.prefersReducedMotion());
      if (active) document.documentElement.setAttribute('data-animations', 'on');
      else document.documentElement.removeAttribute('data-animations');
      dispatch({ kind: 'motionChanged', active });
    };
    applyMotion();
    const stopPreferences = p.preferences.subscribe(applyMotion);

    // The director ticks whether motion is on or off, so time passes in the
    // still diorama too; the clock is read once a minute for the phase.
    const stopTick = p.timer.every(TICK_MS, () => {
      dispatch({ kind: 'tick', ms: TICK_MS });
    });
    const stopClock = p.timer.every(CLOCK_INTERVAL_MS, () => {
      dispatch({ kind: 'clockPhase', phase: phaseAt(p.clock.now()) });
    });

    return () => {
      stopTick();
      stopClock();
      stopPreferences();
      stopSaved?.();
      stopSaved = undefined;
      p.audio.disable();
      document.documentElement.removeAttribute('data-animations');
      live = undefined;
    };
  });
</script>

<svelte:head>
  <title>{GAME_TITLE}</title>
  <meta name="description" content={GAME_DESCRIPTION} />
</svelte:head>

<div class="shell">
  <HeaderBar actions={ACTIONS}>
    {#snippet brand()}
      <Lockup />
    {/snippet}
  </HeaderBar>

  <main>
    <div class="room">
      <SceneCanvas
        bind:this={canvas}
        state={picture}
        animations={scene.motion}
        {frames}
        assets={ASSETS}
        onProgress={(fraction: number) => {
          progress = fraction;
          // The card is for the first load only: a restore after a context
          // loss reloads and reports progress again, but never `onReady`.
          if (card === 'hidden' && !everReady) card = 'loading';
        }}
        onReady={() => {
          progress = 1;
          everReady = true;
          if (card === 'loading') card = 'hidden';
        }}
        onTap={tapped}
        onContextLost={() => undefined}
      />
    </div>
    <!-- The canvas is aria-hidden; this is the room in words, and it changes with it. -->
    <p class="visually-hidden" aria-live="polite">{describeScene(scene)}</p>
    <Caption caption={scene.caption} />
    <div class="controls">
      <ItemControls items={ITEM_CONTROLS} active={scene.at} onselect={select}>
        <PhotoButton oncapture={photograph} {busy} />
      </ItemControls>
    </div>
    <Notice message={photoNotice} sequence={photoFailures} />
  </main>
</div>

<TitleCard mode={card} {progress} caption={scene.caption?.text} phase={scene.phase} />
<SettingsDialog
  open={settingsOpen}
  onclose={() => {
    settingsOpen = false;
  }}
  {time}
  ontime={chooseTime}
  sound={scene.sound}
  onenable={enableSound}
  ondisable={disableSound}
  camera={scene.camera}
  oncamera={chooseCamera}
/>

<style>
  .shell {
    max-inline-size: var(--shell-max);
    margin-inline: auto;
    padding: 0 var(--shell-pad) var(--s-11);
  }

  main {
    padding-block-start: var(--s-6);
  }

  /*
   * Full width; on a phone the height is what the viewport leaves after the
   * header and the controls, and above 60rem a 9:16 box centred (§7).
   */
  .room {
    block-size: clamp(16rem, calc(100svh - 24rem), 40rem);
  }

  @media (min-width: 60rem) {
    .room {
      block-size: auto;
      aspect-ratio: 9 / 16;
      max-inline-size: 22.5rem;
      margin-inline: auto;
    }
  }

  .controls {
    margin-block-start: var(--s-6);
  }
</style>
