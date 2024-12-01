import { newBinding } from '../Binding.js'
import { Binding } from '../Binding.js'
import { Key } from '../Key'
import { keyStr } from '../Key'
import { notNil } from './utils/notNil.js'
import { ErrRepeatedInjectableConfiguration } from './errors.js'
import { mergeObject } from './utils/mergeObject.js'

export namespace TypeRegistrar {
  const _entries = new Map<Key, Binding>()
  const _beans: Array<[Key, Binding]> = []

  export function configure<T>(key: Key<T>, additional: Partial<Binding>, ready: boolean = true): Binding<T> {
    notNil(key)

    const opts = { ready, ...additional }
    const tk = typeof key === 'object' ? key.constructor : key
    const existing = TypeRegistrar.get(tk)

    if (existing) {
      const names = existing.names

      if (opts?.names) {
        if (names.some(value => opts.names!.includes(value))) {
          throw new ErrRepeatedInjectableConfiguration(
            `Found repeated qualifiers for the class '${keyStr(key)}'. Qualifiers found: ${opts.names
              .map(x => keyStr(x))
              .join(', ')}`,
          )
        }

        names.push(...opts.names)

        opts.names = names
      } else {
        opts.names = existing.names
      }

      opts.interceptors = [...existing.interceptors, ...(additional.interceptors || [])]
    }

    const info = newBinding({ ...existing, ...opts, ready })
    const cur = _entries.get(tk)

    if (cur) {
      const binding = mergeObject<Binding<T>>(cur, info)
      _entries.set(tk, binding)

      return binding
    }

    _entries.set(tk, info)

    return info
  }

  export function pre<T>(key: Key<T>, additional: Partial<Binding>): Binding<T> {
    return configure(key, { ...additional }, false)
  }

  export function clearEntries() {
    _entries.clear()
  }

  export function addBean<T>(key: Key<T>, binding: Binding<T>) {
    notNil(key)
    notNil(binding)

    _beans.push([key, binding])
  }

  export function deleteBean(key: Key) {
    notNil(key)

    const idx = _beans.findIndex(([k]) => k === key)

    if (idx > -1) {
      _beans.splice(idx, 1)
    }
  }

  export function get<T>(ctor: Key<T>) {
    return _entries.get(notNil(ctor))
  }

  export function entries(): IterableIterator<[Key, Binding]> {
    return _entries.entries()
  }

  export function beans(): Array<[Key, Binding]> {
    return _beans
  }

  export function remove(key: Key): boolean {
    return _entries.delete(notNil(key))
  }
}
