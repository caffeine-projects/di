import { DeferredCtor } from '../internal/DeferredCtor.js'
import { InjectionOptions, Key, KeyWithOptions } from '../Key'
import { ObjectInjections } from '../Key'

export function inject(key: Key, ...options: Array<InjectionOptions>): KeyWithOptions {
  let descriptor = {}
  for (const opts of options) {
    descriptor = { ...descriptor, ...opts }
  }

  return { key, ...descriptor }
}

export function injectAll(key: Key, ...options: Array<InjectionOptions>): KeyWithOptions {
  return inject(key, ...options, { multiple: true })
}

export function defer(keyFn: () => Key, ...options: Array<InjectionOptions>): KeyWithOptions {
  return inject(new DeferredCtor(keyFn), ...options)
}

export function optional(key?: Key, ...options: Array<InjectionOptions>): KeyWithOptions {
  if (key !== undefined) {
    return inject(key, ...options, { optional: true })
  }

  return { optional: true }
}

export function object(bag: ObjectInjections[]): KeyWithOptions {
  return { objectInjections: bag }
}

export const deps = {
  inject,
  injectAll,
  optional,
  defer,
  object,
}
