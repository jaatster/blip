<script lang="ts">
  import { onMount } from "svelte";

  let { bind }: { bind: string } = $props();
  let open = $state(false);
  onMount(() => document.documentElement.setAttribute("data-mounted", ""));
</script>

<main>
  <button class="pp-box pp-button" type="button" id="open-lazy" onclick={() => (open = true)}>Load game</button>
  <p id="lazy-state">{open ? "open" : "closed"}</p>
  {#if bind === "plain"}
    <pp-dialog open={open} onpp-close={() => (open = false)}>
      <dialog class="pp-box pp-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="pp-dialog-header"><h2 class="pp-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="pp-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </pp-dialog>
  {:else}
    <pp-dialog open={open || undefined} onpp-close={() => (open = false)}>
      <dialog class="pp-box pp-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="pp-dialog-header"><h2 class="pp-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="pp-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </pp-dialog>
  {/if}
</main>
