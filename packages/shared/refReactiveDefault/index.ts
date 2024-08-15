import type { WatchSource } from 'vue-demi'
import { watch } from 'vue-demi'
import { cloneFnJSON, extendRef, useCloned } from '@vueuse/core'

export function cloneFnJSONExtended<T>(source: T): T {
  // In the following cases it doesn't make sense to clone the object
  if (source == null || typeof source !== 'object') // object & array
    return source

  return cloneFnJSON(source)
}

export interface RefReactiveDefaultOptions<T = any> {
  /**
   * Custom clone function.
   *
   * By default, it uses `JSON.parse(JSON.stringify(value))` to clone.
   */
  clone?: (source: T) => T

  /**
   * Watch nested properties inside the object for changes. This is turned on by default.
   * None object/array values are not affected by this flag.
   *
   * Note: In case the deep is set to true, the whole object/arra is cloned and assigned to the ref.
   * Just like the deep property on the vue watch() function, this requires traversing
   * all nested properties and can be expensive when used on large data structures. If you know
   * what you're doing you can turn this off.
   *
   * @default true
   *
   * @example
   * // By default, the ref will be updated when a nested property changes
   * const internalValue = refReactiveDefault(() => props.defaultValue);
   * internalValue.value.details = 'updated value, sync with props.defaultValue is removed';
   *
   * // With deep set to false, the ref will only be updated when the object reference changes, therefore you need to assign a whole new object/array
   * const internalValue = refReactiveDefault(() => props.defaultValue, { deep: false });
   * internalValue.value = { details: 'updated value, sync with props.defaultValue is removed' };
   *
   */
  deep?: boolean

  /**
   * if resetOnDefaultChange is true the value will be reset when the default value changes
   * otherwise it ignores the update on the default value
   */
  resetOnDefaultChange?: boolean
}

/**
 * A ref that has an initial value that is reactive.
 * When the initial value changes, the ref is reset to this value.
 * When you update this ref you're working with a clone of the default value automatically.
 */
export function refReactiveDefault<T>(reactiveDefault: WatchSource<T>, options: RefReactiveDefaultOptions<T> = {}) {
  const {
    clone = cloneFnJSONExtended,
    deep = true,
    resetOnDefaultChange = true,
  } = options

  const { cloned, sync: syncDefault } = useCloned(reactiveDefault, {
    manual: true,
    clone: deep ? clone : d => d, // Only clone when the deep flag is true, otherwise we use the same value/object as the default
    flush: 'sync',
  })

  let isWatching = false
  let isInternalModification = false

  const syncDefaultInternal = () => {
    isInternalModification = true
    syncDefault()
    isInternalModification = false
  }

  const addWatchers = () => {
    isWatching = true

    const unlinkFromDefault = watch(
      reactiveDefault,
      () => {
        syncDefaultInternal()
      },
      {
        flush: 'sync',
        deep,
      },
    )

    const unlinkFromClone = watch(
      cloned,
      () => {
        if (isInternalModification)
          return // ignore internal modifications

        if (!resetOnDefaultChange) {
          unlinkFromDefault()
          unlinkFromClone()
          isWatching = false
        }
      },
      {
        flush: 'sync',
        deep,
      },
    )
  }

  const clonedExtended = extendRef(cloned, {
    reset: () => {
      syncDefaultInternal()
      if (!isWatching) // add watchers again on manual reset
        addWatchers()
    },
  })

  addWatchers()

  return clonedExtended
}
