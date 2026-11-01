<script setup lang="ts">
// What the smoke checks read (tests/real-stack/smoke.mjs), from Vue's state.
import { onMounted, ref, watch } from "vue";

const PLACES = ["Meadow", "Crystal caves", "Castle", "Canyon", "Desert", "Docks"];
const open = ref(false);
const tabs = ref<string[]>([]);
const query = ref("");
const places = ref<string[]>([]);
const error = ref("");

// A search answers each query a moment later.
let search: ReturnType<typeof setTimeout> | undefined;
watch(query, (q) => {
  clearTimeout(search);
  search = setTimeout(() => (places.value = q ? PLACES.filter((p) => p.toLowerCase().includes(q.toLowerCase())) : []), 50);
});
onMounted(() => {
  // The tabs come with their data, after the first render.
  setTimeout(() => (tabs.value = ["Alpha", "Beta", "Gamma"]), 150);
  document.documentElement.setAttribute("data-mounted", "");
});
</script>

<template>
  <main>
    <h1 class="pp-display pp-pop" data-scale="3" data-pop="Level 2">Level 2</h1>

    <section id="docs-tabs" data-smoke="tabs">
      <!-- The start page's tabs, as it writes them. -->
      <pp-tabs class="pp-tabs" data-variant="outline">
        <div class="pp-tabs-list" role="tablist" aria-label="Settings">
          <button class="pp-box pp-tab" data-variant="outline" role="tab" aria-selected="true">General</button>
          <button class="pp-box pp-tab" data-variant="outline" role="tab" aria-selected="false" tabindex="-1">Sound</button>
        </div>
        <div class="pp-tabs-panel" role="tabpanel">Music, screen shake, big text.</div>
        <div class="pp-tabs-panel" role="tabpanel" hidden>Chip sounds are off until you turn them on.</div>
      </pp-tabs>
    </section>

    <section id="dialog">
      <button class="pp-box pp-button" type="button" id="open-dialog" @click="open = true">Load game</button>
      <p id="dialog-state">{{ open ? "open" : "closed" }}</p>
      <!-- Bound as the start page says. -->
      <pp-dialog :open="open || undefined" @pp-close="open = false">
        <dialog class="pp-box pp-dialog" id="save" aria-labelledby="save-title">
          <header class="pp-dialog-header"><h2 class="pp-dialog-title" id="save-title">Load game</h2></header>
          <div class="pp-dialog-body">Slot 2 will be replaced.</div>
          <footer class="pp-dialog-footer"><button class="pp-box pp-button" type="button" id="close-dialog" @click="open = false">Cancel</button></footer>
        </dialog>
      </pp-dialog>
    </section>

    <section id="late-tabs">
      <pp-tabs class="pp-tabs">
        <div class="pp-tabs-list" role="tablist" aria-label="Worlds">
          <button v-for="(t, i) in tabs" :key="t" class="pp-box pp-tab" role="tab" :aria-selected="i === 0 ? 'true' : 'false'" :tabindex="i === 0 ? undefined : -1">{{ t }}</button>
        </div>
        <div v-for="(t, i) in tabs" :key="t" class="pp-tabs-panel" role="tabpanel" :hidden="i !== 0">Panel {{ t }}</div>
      </pp-tabs>
      <button class="pp-box pp-button" type="button" id="add-tab" @click="tabs.push('Delta')">Add a tab</button>
    </section>

    <section id="combobox">
      <label class="pp-field-label" for="place">Start in</label>
      <pp-combobox class="pp-combobox">
        <span class="pp-box pp-input"><input id="place" list="places" v-model="query" aria-autocomplete="list"></span>
        <datalist id="places"><option v-for="p in places" :key="p" :value="p"></option></datalist>
      </pp-combobox>
      <p id="place-state">{{ query }}</p>
    </section>

    <form id="signup" @submit.prevent="error = 'That name is taken.'">
      <pp-field class="pp-field">
        <label class="pp-field-label" for="player">Player name</label>
        <span class="pp-box pp-input"><input id="player" name="player" @input="error = ''"></span>
        <p class="pp-field-help">Shown on the leaderboard.</p>
        <p v-if="error" class="pp-field-error">{{ error }}</p>
      </pp-field>
      <button class="pp-box pp-button" id="submit">Join</button>
    </form>
  </main>
</template>
