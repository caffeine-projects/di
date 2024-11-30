import { DeferredCtor } from '../internal/DeferredCtor.js'
import { InjectionOptions, Token, TokenDescriptor } from '../Token.js'
import { TokenBag } from '../Token.js'

export function inject(token: Token, ...options: Array<InjectionOptions>): TokenDescriptor {
  let descriptor = {}
  for (const opts of options) {
    descriptor = { ...descriptor, ...opts }
  }

  return { token, ...descriptor }
}

export function injectAll(token: Token, ...options: Array<InjectionOptions>): TokenDescriptor {
  return inject(token, ...options, { multiple: true })
}

export function defer(tokenFn: () => Token, ...options: Array<InjectionOptions>): TokenDescriptor {
  return inject(new DeferredCtor(tokenFn), ...options)
}

export function optional(token?: Token, ...options: Array<InjectionOptions>): TokenDescriptor {
  if (token !== undefined) {
    return inject(token, ...options, { optional: true })
  }

  return { optional: true }
}

export function object(bag: TokenBag[]): TokenDescriptor {
  return { bag }
}

export const deps = {
  inject,
  injectAll,
  optional,
  defer,
  object,
}
