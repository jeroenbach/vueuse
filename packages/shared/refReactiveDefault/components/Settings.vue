<script lang="ts" setup>
import { refReactiveDefault } from '@vueuse/core'

export interface Settings {
  size: number | null
  name: string | null
}

const props = defineProps<{
  initialSettings?: Settings | null
}>()

defineEmits<{
  (event: 'save', value: Settings): void
}>()

const state = refReactiveDefault(() => props.initialSettings ?? { size: null, name: null }, {
  // Use the deep flag to allow direct manipulation of the nested properties
  deep: true,
})
const reset = state.reset
</script>

<template>
  <div>
    <label for="size">Size: </label>
    <input id="size" v-model="state.size" type="number" placeholder="Size">
  </div>
  <div>
    <label for="name">Name: </label>
    <input id="name" v-model="state.name" type="text" placeholder="Name">
  </div>
  <pre lang="json">state = {{ state ?? 'null' }}</pre>
  <button @click="reset">
    Reset to initial
  </button>
  <button @click="$emit('save', state)">
    Save
  </button>
</template>
