import { Injection, Token } from '../Token.js'
import { isNamedToken } from '../Token.js'
import { Binding } from '../Binding.js'
import { isNil } from '../internal/utils/isNil.js'
import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'
import { InvalidBindingError } from '../internal/errors.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'
import { ConfigurationProviderOptions } from './ConfigurationProviderOptions.js'

export function Bean(token: Token): <TFunction extends Function>(target: TFunction, context: DecoratorContext) => void

export function Bean(
  token: Token,
  dependencies?: Injection[],
): <TFunction extends Function>(target: TFunction, context: DecoratorContext) => void

export function Bean(
  token: Token,
  name?: Token,
  dependencies?: Injection[],
): <TFunction extends Function>(target: TFunction, context: DecoratorContext) => void

export function Bean(token: Token, nameOrDependencies?: Injection[] | Token) {
  return function <TFunction extends Function>(target: TFunction, context: DecoratorContext) {
    const injections = isNil(nameOrDependencies)
      ? []
      : Array.isArray(nameOrDependencies)
        ? ((nameOrDependencies as Injection[]).map(dep =>
            typeof dep === 'object' ? dep : { token: dep },
          ) as Injection[])
        : []
    const name = isNil(nameOrDependencies)
      ? undefined
      : isNamedToken(nameOrDependencies)
        ? (nameOrDependencies as Token)
        : undefined

    if (context.kind === 'class') {
      const t = target as TFunction

      if (token !== undefined && !isNamedToken(token)) {
        throw new InvalidBindingError(
          `@Bean when used on class level only accepts injection named qualifiers of type string or symbol. ` +
            `Received: ${typeof token}. ` +
            `Check decorator on class '${context.name}'.`,
        )
      }

      const metadata = getOrCreateBeanMetadata(context.metadata)

      TypeRegistrar.configure(t, {
        injections: injections,
        injectableProperties: metadata.injectableProperties,
        injectableMethods: metadata.injectableMethods,
        lookupProperties: metadata.lookupProperties,
        type: target,
        names: name ? [name] : undefined,
        postConstruct: metadata.postConstruct,
        preDestroy: metadata.preDestroy,
      } as Partial<Binding>)

      return
    }

    if (isNil(token)) {
      throw new InvalidBindingError(
        `@Bean when used on @Configuration classes method level, must receive a valid token. Current value is: ${String(
          token,
        )}. Check the decorators on method '${String(context.name)}' from class '${target.constructor.name}'`,
      )
    }

    const metadata = getOrCreateBeanMetadata(context.metadata)
    const type = typeof token === 'function' ? token : undefined
    const actualToken = typeof name === 'undefined' ? token : name

    configureBean(metadata, context.name, {
      dependencies: injections,
      token: actualToken,
      type,
    } as Partial<ConfigurationProviderOptions>)
  }
}
