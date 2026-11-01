<script setup lang="ts">
import { onMounted, ref } from "vue";

defineProps({ bind: { type: String, required: true } });
const open = ref(false);
onMounted(() => document.documentElement.setAttribute("data-mounted", ""));
</script>

<template>
  <main>
    <button class="chu-box chu-button" type="button" id="open-lazy" @click="open = true">Load game</button>
    <p id="lazy-state">{{ open ? "open" : "closed" }}</p>
    <chu-dialog v-if="bind === 'plain'" :open="open" @chu-close="open = false">
      <dialog class="chu-box chu-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="chu-dialog-header"><h2 class="chu-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="chu-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </chu-dialog>
    <chu-dialog v-else :open="open || undefined" @chu-close="open = false">
      <dialog class="chu-box chu-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="chu-dialog-header"><h2 class="chu-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="chu-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </chu-dialog>
  </main>
</template>
