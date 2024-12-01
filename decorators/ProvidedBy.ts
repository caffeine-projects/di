import { Provider } from '../Provider.js'
import { typeRegistrar } from '../internal/TypeRegistrar.js'
import { FactoryProvider } from '../internal/providers/FactoryProvider.js'
import { ResolutionContext } from '../ResolutionContext.js'

export function ProvidedBy<T>(provider: Provider<T> | ((ctx: ResolutionContext) => T)) {
  return function (target: Function, _context: ClassDecoratorContext) {
    typeRegistrar.configure<T>(target, {
      rawProvider: typeof provider === 'function' ? new FactoryProvider(provider) : provider,
    })
  }
}
