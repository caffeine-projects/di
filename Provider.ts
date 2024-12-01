import { Key } from './Key'
import { ClassProvider } from './internal/providers/ClassProvider.js'
import { SimpleKeyedProvider } from './internal/providers/SimpleKeyedProvider'
import { ResolutionContext } from './ResolutionContext.js'
import { Ctor } from './internal/types.js'

export interface Provider<T = any, A = unknown> {
  provide(ctx: ResolutionContext<A>): T
}

export function providerFromKey<T>(key: Key<T>, provider?: Provider<T>): Provider<T> {
  if (typeof provider === 'undefined') {
    if (typeof key === 'function') {
      return new ClassProvider<T>(key as Ctor)
    } else {
      return new SimpleKeyedProvider(key)
    }
  } else {
    return provider
  }
}
