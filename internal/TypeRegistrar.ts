import { newBinding } from '../Binding.js'
import { Binding } from '../Binding.js'
import { Token } from '../Token.js'
import { tokenStr } from '../Token.js'
import { notNil } from './utils/notNil.js'
import { ErrRepeatedInjectableConfiguration } from './errors.js'
import { mergeObject } from './utils/mergeObject.js'

export namespace TypeRegistrar {
  const _entries = new Map<Token, Binding>()
  const _beans: Array<[Token, Binding]> = []

  export function configure<T>(token: Token<T>, additional: Partial<Binding>, ready: boolean = true): Binding<T> {
    notNil(token)

    const opts = { ready, ...additional }
    const tk = typeof token === 'object' ? token.constructor : token
    const existing = TypeRegistrar.get(tk)

    if (existing) {
      const names = existing.names

      if (opts?.names) {
        if (names.some(value => opts.names!.includes(value))) {
          throw new ErrRepeatedInjectableConfiguration(
            `Found repeated qualifiers for the class '${tokenStr(token)}'. Qualifiers found: ${opts.names
              .map(x => tokenStr(x))
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

  export function pre<T>(token: Token<T>, additional: Partial<Binding>): Binding<T> {
    return configure(token, { ...additional }, false)
  }

  export function clearEntries() {
    _entries.clear()
  }

  export function addBean<T>(token: Token<T>, binding: Binding<T>) {
    notNil(token)
    notNil(binding)

    _beans.push([token, binding])
  }

  export function deleteBean(token: Token) {
    notNil(token)

    const idx = _beans.findIndex(([k]) => k === token)

    if (idx > -1) {
      _beans.splice(idx, 1)
    }
  }

  export function get<T>(ctor: Token<T>) {
    return _entries.get(notNil(ctor))
  }

  export function entries(): IterableIterator<[Token, Binding]> {
    return _entries.entries()
  }

  export function beans(): Array<[Token, Binding]> {
    return _beans
  }

  export function remove(token: Token): boolean {
    return _entries.delete(notNil(token))
  }
}
