import { TypeRegistrar } from '../internal/TypeRegistrar.js'
import { Identifier } from '../internal/types.js'

export function Namespace<T>(namespace: Identifier) {
  return function <TFunction extends Function>(target: TFunction, _context: ClassDecoratorContext) {
    TypeRegistrar.configure<T>(target, { namespace })
  }
}
