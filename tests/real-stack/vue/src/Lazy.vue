<script setup lang="ts">
import { onMounted, ref } from "vue";

defineProps({ bind: { type: String, required: true } });
const open = ref(false);
onMounted(() => document.documentElement.setAttribute("data-mounted", ""));
</script>

<template>
  <main>
    <button class="pp-box pp-button" type="button" id="open-lazy" @click="open = true">Load game</button>
    <p id="lazy-state">{{ open ? "open" : "closed" }}</p>
    <pp-dialog v-if="bind === 'plain'" :open="open" @pp-close="open = false">
      <dialog class="pp-box pp-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="pp-dialog-header"><h2 class="pp-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="pp-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </pp-dialog>
    <pp-dialog v-else :open="open || undefined" @pp-close="open = false">
      <dialog class="pp-box pp-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="pp-dialog-header"><h2 class="pp-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="pp-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </pp-dialog>
  </main>
</template>
