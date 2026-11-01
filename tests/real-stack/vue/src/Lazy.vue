<script setup lang="ts">
import { onMounted, ref } from "vue";

defineProps({ bind: { type: String, required: true } });
const open = ref(false);
onMounted(() => document.documentElement.setAttribute("data-mounted", ""));
</script>

<template>
  <main>
    <button class="blip-box blip-button" type="button" id="open-lazy" @click="open = true">Load game</button>
    <p id="lazy-state">{{ open ? "open" : "closed" }}</p>
    <blip-dialog v-if="bind === 'plain'" :open="open" @blip-close="open = false">
      <dialog class="blip-box blip-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="blip-dialog-header"><h2 class="blip-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="blip-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </blip-dialog>
    <blip-dialog v-else :open="open || undefined" @blip-close="open = false">
      <dialog class="blip-box blip-dialog" id="lazy" aria-labelledby="lazy-title">
        <header class="blip-dialog-header"><h2 class="blip-dialog-title" id="lazy-title">Load game</h2></header>
        <div class="blip-dialog-body">Slot 2 will be replaced.</div>
      </dialog>
    </blip-dialog>
  </main>
</template>
