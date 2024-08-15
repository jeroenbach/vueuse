---
category: Reactivity
---

# refReactiveDefault

A ref that allows a component to stay in charge over its own state.

::: warning
This function only works for Vue 2.7 or above.
:::

## Usage

Create a ref that has an initial value coming from another ref or prop. You can start working directly with this data, without affecting the the initial value.

```ts
import { refReactiveDefault } from '@vueuse/core'

const defaultValue = ref('Hello world!')

const state = refReactiveDefault(defaultValue)
console.log(state.value) // hello world!

state.value = 'Updated value'
console.log(state.value) // Updated value

defaultValue.value = 'Changed from default'
console.log(state.value) // Changed from default
```

Maybe a better scenario is for example when we receive an initial value from a parent component (that was collected async and had a delay), we still want the component to take this value into account but we don't want to keep track of that value in the parent component.

```ts
const props = defineProps<{
  initialSettings?: Settings | null
}>()

const state = refReactiveDefault(() => props.initialValue)
console.log(state.value) // { size: 12, name: 'John Doe'}

state.value.name = 'Updated name'
console.log(props.initialSettings) // { size: 12, name: 'John Doe'}
console.log(state.value) // { size: 12, name: 'Updated name'}

// Parent updates the initialSettings
console.log(state.value) // { size: 12, name: 'Updated from parent'}
```
