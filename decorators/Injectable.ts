import { Binding } from '../Binding.js'
import { ErrInvalidBinding } from '../internal/errors.js'
import { isNamedToken } from '../Token.js'
import { Token } from '../Token.js'
import { Injection } from '../Token.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils'

export function Injectable<T>(tokenOrDependencies?: Token | Injection[], dependencies?: Injection[]) {
  return function <TFunction extends Function>(
    target: TFunction,
    context: ClassDecoratorContext | ClassMethodDecoratorContext,
  ) {
    dependencies = dependencies || []

    let token =
      tokenOrDependencies !== undefined && !Array.isArray(tokenOrDependencies) ? tokenOrDependencies : undefined
    const deps =
      tokenOrDependencies === undefined ? [] : Array.isArray(tokenOrDependencies) ? tokenOrDependencies : dependencies

    if (token !== undefined && !isNamedToken(token)) {
      throw new ErrInvalidBinding(
        `@Injectable when it is used to decorate a class, it only accepts injection named qualifiers of type string or symbol. ` +
          `Received: ${typeof token}. ` +
          `Check decorator on class '${String(context.name)}'.`,
      )
    }

    token = token ? token : target

    const metadata = getOrCreateBeanMetadata(context.metadata)
    const injections = deps.map(dep => (typeof dep === 'object' ? dep : { token: dep }))

    TypeRegistrar.configure<T>(target, {
      injections: injections,
      injectableProperties: metadata.injectableProperties,
      injectableMethods: metadata.injectableMethods,
      lookupProperties: metadata.lookupProperties,
      type: target,
      names: token ? [token] : undefined,
      postConstruct: metadata.postConstruct,
      preDestroy: metadata.preDestroy,
    } as Partial<Binding>)
  }
}
