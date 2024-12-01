import { typeRegistrar } from '../internal/TypeRegistrar.js'
import { Ctor } from '../internal/types.js'

export function LateBind<T>(lateBind = true) {
  return function (target: Ctor<T>, _context: ClassDecoratorContext) {
    typeRegistrar.configure<T>(target, { late: lateBind })
  }
}
