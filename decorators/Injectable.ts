import { Binding } from '../Binding.js'
import { ErrInvalidBinding } from '../internal/errors.js'
import { isNamedKey } from '../Key'
import { Key } from '../Key'
import { Injection } from '../Key'
import { typeRegistrar } from '../internal/TypeRegistrar.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils'

export function Injectable<T>(keyOrDependencies?: Key | Injection[], dependencies?: Injection[]) {
  return function <TFunction extends Function>(
    target: TFunction,
    context: ClassDecoratorContext | ClassMethodDecoratorContext,
  ) {
    dependencies = dependencies || []

    let key = keyOrDependencies !== undefined && !Array.isArray(keyOrDependencies) ? keyOrDependencies : undefined
    const deps =
      keyOrDependencies === undefined ? [] : Array.isArray(keyOrDependencies) ? keyOrDependencies : dependencies

    if (key !== undefined && !isNamedKey(key)) {
      throw new ErrInvalidBinding(
        `@Injectable when it is decorating a class, it only accepts injection named qualifiers of type string or symbol.\n` +
          `Received: ${typeof key}.\n` +
          `Check decorator on class '${String(context.name)}'.`,
      )
    }

    key = key ? key : target

    const metadata = getOrCreateBeanMetadata(context.metadata)
    const injections = deps.map(dep => (typeof dep === 'object' ? dep : { key: dep }))

    typeRegistrar.configure<T>(target, {
      injections: injections,
      injectableProperties: metadata.injectableProperties,
      injectableMethods: metadata.injectableMethods,
      lookupProperties: metadata.lookupProperties,
      type: target,
      names: key ? [key] : undefined,
      postConstruct: metadata.postConstruct,
      preDestroy: metadata.preDestroy,
    } as Partial<Binding>)
  }
}
