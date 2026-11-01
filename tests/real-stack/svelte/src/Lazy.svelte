<script lang="ts">
  import { onMount } from "svelte";

  let { bind }: { bind: string } = $props();
  let open = $state(false);
  onMount(() => document.documentElement.setAttribute("data-mounted", ""));
</script>

<main>
  <button class="blip-box blip-button" type="button" id="open-lazy" onclick={() => (open = true)}>Load game</button>
  <p id="lazy-state">{open ? "open" : "closed"}</p>
  {#if bind === "plain"}
    <blip-dialog open={open} onpp-close={() => (open = false)}>
      <dialog class="blip-box blip-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="blip-dialog-header"><h2 class="blip-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="blip-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </blip-dialog>
  {:else}
    <blip-dialog open={open || undefined} onpp-close={() => (open = false)}>
      <dialog class="blip-box blip-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="blip-dialog-header"><h2 class="blip-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="blip-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </blip-dialog>
  {/if}
</main>
