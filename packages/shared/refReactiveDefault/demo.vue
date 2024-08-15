<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { ref } from 'vue-demi'
import type { Settings } from './components/Settings.vue'
import Form from './components/Settings.vue'

const sleep = (timeInMs: number) => new Promise(resolve => setTimeout(resolve, timeInMs))
let size = 12
const savedSettings = ref<Settings | null>(null)

const { state, execute, isLoading } = useAsyncState<Settings | null>(async () => {
  await sleep(1000)
  savedSettings.value = null
  size++
  return {
    size,
    name: 'John Doe',
  }
}, null, {
  resetOnExecute: false,
})
</script>

<template>
  <h2>Parent component:</h2>
  <p>Collect and set the initial value of the child</p>
  <button @click="execute(0)">
    Reload settings
  </button>
  <note :class="{ invisible: !isLoading }">
    Fetching value's from an external API
  </note>
  <hr>
  <h2>Child component:</h2>
  <p>Allow updating the value's without notifying the parent.</p>
  <Form :initial-settings="state" @save="value => savedSettings = value" />
  <hr>
  <p>Parent receives updated value's only on @save event:</p>
  <pre lang="json">savedSettings = {{ savedSettings ?? 'null' }}</pre>
</template>
