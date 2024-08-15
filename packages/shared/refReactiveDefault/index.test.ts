import type { PropType } from 'vue-demi'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref, watch } from 'vue-demi'
import { cloneFnJSONExtended, refReactiveDefault } from '.'

interface Message {
  details?: string
  categories?: string[]
  children?: Message[]
};

describe('cloneFnJSONExtended', () => {
  it('should work with null values', async () => {
    expect(cloneFnJSONExtended(null)).toBe(null)
    expect(cloneFnJSONExtended(undefined)).toBe(undefined)
  })

  it('should work with primitive values', async () => {
    expect(cloneFnJSONExtended(1)).toBe(1)
    expect(cloneFnJSONExtended('string')).toBe('string')
  })

  it('should work with object values', async () => {
    const obj = { key: 'value' }
    expect(cloneFnJSONExtended(obj)).toEqual(obj)
    expect(cloneFnJSONExtended(obj)).not.toBe(obj)
  })

  it('should work with array values', async () => {
    const arr = [1, 2, 3]
    expect(cloneFnJSONExtended(arr)).toEqual(arr)
    expect(cloneFnJSONExtended(arr)).not.toBe(arr)
  })
})

describe('refReactiveDefault', () => {
  it('should work with null values', async () => {
    const state = refReactiveDefault<string | null>(() => null)
    expect(state.value).toBe(null)
    state.value = 'changed'
    expect(state.value).toBe('changed')
  })

  it('should work correctly with null/undefined values', async () => {
    const defaultValue = ref<string>()
    const state = refReactiveDefault(defaultValue)
    expect(state.value).toBeUndefined()
    defaultValue.value = 'changed'
    expect(state.value).toBe('changed')
  })

  it('should work correctly with null/undefined values with reference values', async () => {
    const defaultValue = ref<string[]>()
    const state = refReactiveDefault(defaultValue)
    expect(state.value).toBeUndefined()
    defaultValue.value = ['changed']
    expect(state.value).toEqual(['changed'])
  })

  it('should show have the latest version of the default value', async () => {
    const defaultValue = ref('initial')
    const state = refReactiveDefault(defaultValue)
    expect(state.value).toBe('initial')
    defaultValue.value = 'changed'
    expect(state.value).toBe('changed')
  })

  it('should show the dependent value if the dependend value is changed', async () => {
    const defaultValue = ref('initial')
    const state = refReactiveDefault(defaultValue)
    expect(state.value).toBe('initial')
    state.value = 'changed'
    defaultValue.value = 'also changed'
    expect(state.value).toBe('also changed')
    expect(defaultValue.value).toBe('also changed')
  })

  it('should show the default value until the main value is changed', async () => {
    const defaultValue = ref('initial')
    const state = refReactiveDefault(defaultValue, {
      resetOnDefaultChange: false,
    })
    expect(state.value).toBe('initial')
    state.value = 'changed'
    defaultValue.value = 'also changed'
    expect(state.value).toBe('changed')
    expect(defaultValue.value).toBe('also changed')
  })

  it('should reset back to the default value when we reset', async () => {
    const defaultValue = ref('initial')
    const state = refReactiveDefault(defaultValue)
    state.value = 'changed'
    defaultValue.value = 'also changed'
    expect(state.value).toBe('also changed')
    state.value = 'changed 123'
    state.reset()
    expect(state.value).toBe('also changed')
    defaultValue.value = 'changed again'
    expect(state.value).toBe('changed again')
  })

  it('should work with deep changes on the default (by default)', async () => {
    const defaultValue = ref<Message>({
      children: [{ details: 'child details' }],
    })
    const state = refReactiveDefault(defaultValue)
    defaultValue.value.children![0].details = 'updated child details'
    expect(state.value).toEqual({
      children: [{ details: 'updated child details' }],
    })
  })

  it('should also show the latest version of the default value when working with an object or array and reference - deep false', async () => {
    const defaultValue = ref<Message>({
      children: [{ details: 'child details' }],
    })
    const state = refReactiveDefault(defaultValue, { deep: false })
    state.value = {
      children: [{ details: 'updated child details' }],
    }
    expect(state.value).toEqual({
      children: [{ details: 'updated child details' }],
    })
  })

  it('should not work with deep changes on the default when deep is false', async () => {
    const defaultValue = ref<Message>({
      children: [{ details: 'child details' }],
    })
    const state = refReactiveDefault(defaultValue, { deep: false })
    let reactivityTriggered = false
    watch(
      state,
      () => {
        reactivityTriggered = true
      },
      { flush: 'sync' },
    )
    defaultValue.value.children![0].details = 'updated child details'

    // The object is updated, because both variables are a reference to the same object
    expect(state.value).toEqual({
      children: [{ details: 'updated child details' }],
    })
    // But reactivity is not triggered
    expect(reactivityTriggered).toBeFalsy()
  })

  it('should reset back to the default value when we reset an object', async () => {
    const defaultValue = ref({
      children: [{ details: 'child details' }],
    })
    const state = refReactiveDefault(defaultValue)
    state.value.children![0].details = 'changed child details'
    defaultValue.value.children![0].details = 'also changed child details'
    expect(state.value).toEqual({
      children: [{ details: 'also changed child details' }],
    })
    state.value.children![0].details = 'changed once again'
    state.reset()
    expect(state.value).toEqual({
      children: [{ details: 'also changed child details' }],
    })
    defaultValue.value.children![0].details = 'child details'
    expect(state.value).toEqual({
      children: [{ details: 'child details' }],
    })
  })

  it('should reset back to the default value and turn on syncing when we reset an object', async () => {
    const defaultValue = ref({
      children: [{ details: 'child details' }],
    })
    const state = refReactiveDefault(defaultValue, {
      resetOnDefaultChange: false, // breaks the sync
    })
    state.value.children![0].details = 'changed child details'
    defaultValue.value.children![0].details = 'also changed child details'
    expect(state.value).toEqual({
      children: [{ details: 'changed child details' }], // sync is stopped
    })
    state.reset() // should enable syncing again
    expect(state.value).toEqual({
      children: [{ details: 'also changed child details' }],
    })
    defaultValue.value.children![0].details = 'child details'
    expect(state.value).toEqual({
      children: [{ details: 'child details' }], // sync working again
    })
  })

  it.only('should not work with deep changes when it is turned off', async () => {
    const defaultValue = ref<Message>({
      children: [{ details: 'child details' }],
    })
    const state = refReactiveDefault(defaultValue, { deep: false })
    let reactivityTriggered = false
    watch(
      state,
      () => {
        reactivityTriggered = true
      },
      { flush: 'sync' }, // no deep watchers here
    )

    defaultValue.value.children![0].details = 'updated child details'
    expect(state.value).toEqual({
      children: [{ details: 'updated child details' }], // this is updated because we modified the object and this is a reference
    })
    // But reactivity has not responded
    expect(reactivityTriggered).toBeFalsy()

    // So, if we update the default, the changes are overridden
    defaultValue.value = {
      children: [{ details: 'child details' }],
    }
    expect(state.value).toEqual({
      children: [{ details: 'child details' }],
    })
    expect(reactivityTriggered).toBeTruthy()
  })

  it('should work with deep changes by default', async () => {
    const defaultValue = ref<Message>({
      children: [{ details: 'child details' }],
    })
    const state = refReactiveDefault(defaultValue)
    let reactivityTriggered = false
    watch(
      state,
      () => {
        reactivityTriggered = true
      },
      { flush: 'sync', deep: true },
    )

    state.value.children![0].details = 'updated child details'
    expect(state.value).toEqual({
      children: [{ details: 'updated child details' }],
    })
    expect(reactivityTriggered).toBeTruthy()
    defaultValue.value = {
      children: [{ details: 'child details' }],
    }
    expect(state.value).toEqual({
      children: [{ details: 'child details' }],
    })
  })

  it('should still work after multiple deep changes on the source and default value', async () => {
    const defaultValue = ref<Message>({
      children: [{ details: 'child details' }],
    })
    const state = refReactiveDefault(defaultValue)
    defaultValue.value.children![0].details = 'first update on default'
    expect(state.value.children![0].details).toBe('first update on default')
    defaultValue.value.children![0].details = 'second update on default'
    expect(state.value.children![0].details).toBe(
      'second update on default',
    )

    state.value.children![0].details = 'third update on source'
    expect(state.value.children![0].details).toBe('third update on source')
    state.value.children![0].details = 'fourth update on source'
    expect(state.value.children![0].details).toBe('fourth update on source')

    defaultValue.value.children![0].details = 'fifth update on default'
    expect(state.value.children![0].details).toBe('fifth update on default')

    state.value.children![0].details = 'sixth update on source'
    expect(state.value.children![0].details).toBe('sixth update on source')
  })

  it('should work after multiple deep changes on the default value, but ignore changes on the default if configured', async () => {
    const defaultValue = ref<Message>({
      children: [{ details: 'child details' }],
    })
    const state = refReactiveDefault(defaultValue, {
      resetOnDefaultChange: false,
    })
    defaultValue.value.children![0].details = 'first update on default'
    expect(state.value.children![0].details).toBe('first update on default')
    defaultValue.value.children![0].details = 'second update on default'
    expect(state.value.children![0].details).toBe(
      'second update on default',
    )

    state.value.children![0].details = 'third update on source'
    expect(state.value.children![0].details).toBe('third update on source')
    state.value.children![0].details = 'fourth update on source'
    expect(state.value.children![0].details).toBe('fourth update on source')

    defaultValue.value.children![0].details
      = 'fifth update on default, but should be ignored'
    expect(state.value.children![0].details).toBe('fourth update on source')

    state.value.children![0].details = 'sixth update on source'
    expect(state.value.children![0].details).toBe('sixth update on source')
  })

  it('should ignore default updates when updating a property inside a component with resetOnDefaultChange false', async () => {
    const continueStep1 = ref(false) // Step1: update the prop
    const continueStep2 = ref(false) // Step2: update the internal value
    const continueStep3 = ref(false) // Step3: update the prop again (which should be ignored)

    const childComponent = defineComponent({
      props: {
        message: {
          type: Object as PropType<Message>,
          default: null,
        },
      },
      data() {
        // Here we're using the message property
        const state = refReactiveDefault(() => this.message, {
          resetOnDefaultChange: false,
        })

        watch(
          continueStep2,
          () => {
            // Deep updated
            state.value.children![0].details
              = 'updated child message details'
          },
          {
            flush: 'sync',
          },
        )

        return { state }
      },

      template: `{{ state }}`,
    })
    const parent = defineComponent({
      components: { ChildComponent: childComponent },
      data() {
        const message = ref<Message>({
          details: 'message detail',
          categories: ['category 1', 'category 2', 'category 3'],
          children: [{ details: 'child message details' }],
        })

        watch(
          continueStep1,
          () => {
            message.value = {
              details: 'message detail',
              categories: ['category 1', 'updated category 2', 'category 3'],
              children: [{ details: 'child message details' }],
            }
          },
          {
            flush: 'sync',
          },
        )

        watch(
          continueStep3,
          () => {
            message.value = {
              details: 'message detail',
              categories: ['category 1', 'category 2', 'category 3'],
              children: [{ details: 'child message details' }],
            }
          },
          {
            flush: 'sync',
          },
        )

        return { message }
      },
      template: `<ChildComponent :message="message" />`,
    })

    const wrapper = mount(parent)
    const vm = wrapper.getComponent(childComponent).vm as any

    expect(vm.state).toEqual(vm.message) // should be the same as the prop
    continueStep1.value = true // update the prop from the parent
    await nextTick()
    expect(vm.state).toEqual({
      details: 'message detail',
      categories: ['category 1', 'updated category 2', 'category 3'],
      children: [{ details: 'child message details' }],
    })
    continueStep2.value = true // update the internal value
    await nextTick()
    expect(vm.state).toEqual({
      details: 'message detail',
      categories: ['category 1', 'updated category 2', 'category 3'],
      children: [{ details: 'updated child message details' }],
    })
    continueStep3.value = true // update the prop again, this should be ignored
    await nextTick()
    expect(vm.state).toEqual({
      details: 'message detail',
      categories: ['category 1', 'updated category 2', 'category 3'],
      children: [{ details: 'updated child message details' }],
    })
  })

  it('should reflect default updates when updating a property inside a component with resetOnDefaultChange true', async () => {
    const continueStep1 = ref(false) // Step1: update the prop
    const continueStep2 = ref(false) // Step2: update the internal value
    const continueStep3 = ref(false) // Step3: update the prop again (which should not be ignored)

    const childComponent = defineComponent({
      props: {
        message: {
          type: Object as PropType<Message>,
          default: null,
        },
      },
      data() {
        // Here we're using the message property
        const state = refReactiveDefault(() => this.message)

        watch(
          continueStep2,
          () => {
            // Deep updated
            state.value.children![0].details
              = 'updated child message details'
          },
          {
            flush: 'sync',
          },
        )

        return { state }
      },

      template: `{{ state }}`,
    })
    const parent = defineComponent({
      components: { ChildComponent: childComponent },
      data() {
        const message = ref<Message>({
          details: 'message detail',
          categories: ['category 1', 'category 2', 'category 3'],
          children: [{ details: 'child message details' }],
        })

        watch(
          continueStep1,
          () => {
            message.value = {
              details: 'message detail',
              categories: ['category 1', 'updated category 2', 'category 3'],
              children: [{ details: 'child message details' }],
            }
          },
          {
            flush: 'sync',
          },
        )

        watch(
          continueStep3,
          () => {
            message.value = {
              details: 'message detail',
              categories: ['category 1', 'category 2', 'category 3'],
              children: [{ details: 'child message details' }],
            }
          },
          {
            flush: 'sync',
          },
        )

        return { message }
      },
      template: `<ChildComponent :message="message" />`,
    })

    const wrapper = mount(parent)
    const vm = wrapper.getComponent(childComponent).vm as any

    expect(vm.state).toEqual(vm.message) // should be the same as the prop
    continueStep1.value = true // update the prop from the parent
    await nextTick()
    expect(vm.state).toEqual({
      details: 'message detail',
      categories: ['category 1', 'updated category 2', 'category 3'],
      children: [{ details: 'child message details' }],
    })
    continueStep2.value = true // update the internal value
    await nextTick()
    expect(vm.state).toEqual({
      details: 'message detail',
      categories: ['category 1', 'updated category 2', 'category 3'],
      children: [{ details: 'updated child message details' }],
    })
    continueStep3.value = true // update the prop again, this should be reflected
    await nextTick()
    expect(vm.state).toEqual({
      details: 'message detail',
      categories: ['category 1', 'category 2', 'category 3'],
      children: [{ details: 'child message details' }],
    })
  })
})
