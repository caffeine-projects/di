import { DeferredCtor } from './internal/DeferredCtor.js'
import { AbstractCtor } from './internal/types.js'
import { Ctor } from './internal/types.js'

export type Key<T = any> = Ctor<T> | DeferredCtor<T> | AbstractCtor<T> | string | symbol | Function

export type KeyWithOptions<T = any> = {
  key?: Key<T>
  objectInjections?: ObjectInjections[]
  multiple?: boolean
  optional?: boolean
  decorated?: boolean
}

export interface ObjectInjections {
  key: Key
  property: string | symbol
  optional?: boolean
  multiple?: boolean
}

export interface InjectionOptions {
  objectDescriptor?: KeyWithOptions[]
  multiple?: boolean
  optional?: boolean
  decorated?: boolean
}

export type Injection<T = unknown> = Key<T> | KeyWithOptions<T>

export function isNamedKey(dep: unknown): dep is string | symbol {
  return (typeof dep === 'string' && dep.length > 0) || typeof dep === 'symbol'
}

export function keyStr(key?: Key): string {
  return key === undefined ? '(undefined)' : typeof key === 'function' ? key.name : key.toString()
}

export function isValidKey(key: unknown): boolean {
  return key !== undefined && key !== null && (isNamedKey(key) || typeof key === 'function')
}
