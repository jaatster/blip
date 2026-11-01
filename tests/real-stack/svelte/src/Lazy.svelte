<script lang="ts">
  import { onMount } from "svelte";

  let { bind }: { bind: string } = $props();
  let open = $state(false);
  onMount(() => document.documentElement.setAttribute("data-mounted", ""));
</script>

<main>
  <button class="chu-box chu-button" type="button" id="open-lazy" onclick={() => (open = true)}>Load game</button>
  <p id="lazy-state">{open ? "open" : "closed"}</p>
  {#if bind === "plain"}
    <chu-dialog open={open} onpp-close={() => (open = false)}>
      <dialog class="chu-box chu-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="chu-dialog-header"><h2 class="chu-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="chu-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </chu-dialog>
  {:else}
    <chu-dialog open={open || undefined} onpp-close={() => (open = false)}>
      <dialog class="chu-box chu-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="chu-dialog-header"><h2 class="chu-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="chu-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </chu-dialog>
  {/if}
</main>
