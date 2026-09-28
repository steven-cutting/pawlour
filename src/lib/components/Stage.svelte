<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * The page's layout: the platform's chrome in its shell, and the room out
   * of it (decision 0016).
   *
   * Three slots. `header` is the platform's `HeaderBar`; `room` is the scene
   * and the sentence that says it in words; `aside` is the caption, the
   * controls and the notice. The room and the aside are the page's `main`
   * landmark; the header is not.
   *
   * The page is a grid the height of the viewport. The header and the aside
   * each sit in a shell of their own, `--shell-max` wide with `--shell-pad`
   * gutters, and the room sits in none, so it is the viewport's width and
   * takes the height the other two leave. The breakout is this structure
   * rather than a negative margin, which would overflow by a scrollbar.
   *
   * The room's box must not move when a caption appears, or the camera would
   * re-frame under the reader: the aside reserves two lines of the platform
   * `Notice` at its own size and margins above the 44px control row, and
   * stacks from the bottom, so a caption fills the reserve rather than
   * pushing the room. `contain: size` keeps the canvas's own drawing-buffer
   * size out of the grid's arithmetic, so the room is sized by the page and
   * never by what it draws; the least it is sized to is `--room-min`, and a
   * viewport too short for that and the chrome scrolls down instead.
   *
   * On a phone held sideways (landscape, at most 30rem tall) the grid turns
   * into columns: the header on the left, the room in the middle at the full
   * height, the aside on the right. `HeaderBar` is a wrapping row that
   * collapses the lockup's words only under a viewport-width query, so the
   * header is stood up by two reach-ins scoped to that query: its direction,
   * and the words out of the layout with the declarations `HeaderBar`'s own
   * collapse uses, so the heading keeps its name (`tickets/H02-*.md` asks the
   * platform for a prop instead).
   *
   * No `{#if}`: every slot is required and rendered, so no branch goes
   * uncovered. Every selector names an element this markup carries, because
   * `svelte-check --fail-on-warnings` fails an unused one.
   */
  let { header, room, aside }: { header: Snippet; room: Snippet; aside: Snippet } = $props();
</script>

<div class="stage">
  <div class="header">
    {@render header()}
  </div>
  <main>
    <div class="room">
      {@render room()}
    </div>
    <div class="aside">
      {@render aside()}
    </div>
  </main>
</div>

<style>
  .stage {
    /*
     * Two lines of the caption at the `Notice`'s small size, budgeted at 1.5
     * lines apiece because the platform leaves line-height at `normal`, plus
     * the notice's padding, rule and margins.
     */
    --caption-reserve: calc(
      2 * 1.5 * var(--fs-small) + 2 * var(--s-2) + 2 * var(--rule-w) + 2 * var(--s-6)
    );

    /*
     * The least room worth drawing. Below it the page scrolls down rather
     * than the scene running under the caption and the controls; nothing
     * scrolls sideways. The canvas fills whatever box this leaves it.
     */
    --room-min: 12rem;

    display: grid;
    grid-template: auto minmax(0, 1fr) / minmax(0, 1fr);
    min-block-size: 100svh;
  }

  .header,
  .aside {
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: var(--shell-max);
    margin-inline: auto;
    padding-inline: var(--shell-pad);
  }

  main {
    display: grid;
    grid-template: minmax(var(--room-min), 1fr) auto / minmax(0, 1fr);
    min-block-size: 0;
  }

  .room {
    display: grid;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    min-block-size: 0;
    contain: size;
  }

  .aside {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-block-size: calc(var(--caption-reserve) + 44px + var(--s-6));
    padding-block-end: var(--s-6);
  }

  @media (orientation: landscape) and (max-height: 30rem) {
    .stage {
      grid-template: minmax(var(--room-min), 1fr) / auto minmax(0, 1fr);
    }

    main {
      grid-template: minmax(0, 1fr) / minmax(0, 1fr) 12.5rem;
    }

    .header {
      display: flex;
      max-inline-size: none;
      margin-inline: 0;
      padding-inline: var(--s-2);
    }

    .header :global(header) {
      flex-direction: column;
      flex-wrap: nowrap;
      justify-content: flex-start;
      padding-block: var(--s-4);
      border-block-end: 0;
      border-inline-end: var(--rule-w) solid var(--rule);
    }

    /* `HeaderBar`'s own collapse, from `app.css`'s `.visually-hidden`: out of the layout, not the name. */
    .header :global(.words) {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    .aside {
      justify-content: center;
      max-inline-size: none;
      min-block-size: 0;
      padding: var(--s-4) var(--s-4) var(--s-4) var(--s-4);
      overflow-y: auto;
    }
  }
</style>
