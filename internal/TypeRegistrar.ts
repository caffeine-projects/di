import { newBinding } from '../Binding.js'
import { Binding } from '../Binding.js'
import { Key } from '../Key'
import { keyStr } from '../Key'
import { notNil } from './utils/notNil.js'
import { ErrRepeatedInjectableConfiguration } from './errors.js'
import { mergeObject } from './utils/mergeObject.js'

const Entries = new Map<Key, Binding>()
const Beans: Array<[Key, Binding]> = []

export const typeRegistrar = {
  configure<T>(key: Key<T>, additional: Partial<Binding>, ready: boolean = true): Binding<T> {
    notNil(key)

    const opts = { ready, ...additional }
    const tk = typeof key === 'object' ? key.constructor : key
    const existing = typeRegistrar.get(tk)

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
    const cur = Entries.get(tk)

    if (cur) {
      const binding = mergeObject<Binding<T>>(cur, info)
      Entries.set(tk, binding)

      return binding
    }

    Entries.set(tk, info)

    return info
  },

  pre<T>(key: Key<T>, additional: Partial<Binding>): Binding<T> {
    return typeRegistrar.configure(key, { ...additional }, false)
  },

  clearEntries() {
    Entries.clear()
  },

  addBean<T>(key: Key<T>, binding: Binding<T>) {
    notNil(key)
    notNil(binding)

    Beans.push([key, binding])
  },

  deleteBean(key: Key) {
    notNil(key)

    const idx = Beans.findIndex(([k]) => k === key)

    if (idx > -1) {
      Beans.splice(idx, 1)
    }
  },

  get<T>(ctor: Key<T>) {
    return Entries.get(notNil(ctor))
  },

  entries(): IterableIterator<[Key, Binding]> {
    return Entries.entries()
  },

  beans(): Array<[Key, Binding]> {
    return Beans
  },

  remove(key: Key): boolean {
    return Entries.delete(notNil(key))
  },
}
