import { SimpleKeyedProvider } from '../internal/providers/SimpleKeyedProvider'
import { check } from '../internal/utils/check.js'
import { typeRegistrar } from '../internal/TypeRegistrar.js'
import { AbstractCtor } from '../internal/types.js'
import { Ctor } from '../internal/types.js'

export function Extends<T>(base: Ctor<T> | AbstractCtor<T>) {
  check(typeof base === 'function', `@Extends parameter must be a class reference (typeof 'function')`)

  return function <TFunction extends Function>(target: TFunction, _context: ClassDecoratorContext) {
    typeRegistrar.configure<T>(base, { rawProvider: new SimpleKeyedProvider(target) })
  }
}
