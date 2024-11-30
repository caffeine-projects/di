import { DeferredCtor } from './internal/DeferredCtor.js'
import { AbstractCtor } from './internal/types.js'
import { Ctor } from './internal/types.js'

export type Token<T = any> = Ctor<T> | DeferredCtor<T> | AbstractCtor<T> | string | symbol | Function

export type TokenDescriptor<T = any> = {
  token?: Token<T>
  bag?: TokenBag[]
  multiple?: boolean
  optional?: boolean
  decorated?: boolean
}

export interface TokenBag {
  token: Token
  key: string | symbol
  optional?: boolean
  multiple?: boolean
}

export interface InjectionOptions {
  objectDescriptor?: TokenDescriptor[]
  multiple?: boolean
  optional?: boolean
  decorated?: boolean
}

export type Injection<T = unknown> = Token<T> | TokenDescriptor<T>

export function isNamedToken(dep: unknown): dep is string | symbol {
  return (typeof dep === 'string' && dep.length > 0) || typeof dep === 'symbol'
}

export function tokenStr(token?: Token): string {
  return token === undefined ? '(undefined)' : typeof token === 'function' ? token.name : token.toString()
}

export function isValidToken(token: unknown): boolean {
  return token !== undefined && token !== null && (isNamedToken(token) || typeof token === 'function')
}
