import { Injection, Key } from '../Key'
import { isNamedKey } from '../Key'
import { Binding } from '../Binding.js'
import { isNil } from '../internal/utils/isNil.js'
import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'
import { ConfigurationProviderOptions } from '../internal/utils/beanUtils.js'
import { ErrInvalidBinding } from '../internal/errors.js'
import { typeRegistrar } from '../internal/TypeRegistrar.js'
import { KeyWithOptions } from '../Key'

export function Bean(key: Key): <TFunction extends Function>(target: TFunction, context: DecoratorContext) => void

export function Bean(
  key: Key,
  dependencies?: Injection[],
): <TFunction extends Function>(target: TFunction, context: DecoratorContext) => void

export function Bean(
  key: Key,
  name?: Key,
  dependencies?: Injection[],
): <TFunction extends Function>(target: TFunction, context: DecoratorContext) => void

export function Bean(key: Key, nameOrDependencies?: Injection[] | Key) {
  return function <TFunction extends Function>(target: TFunction, context: DecoratorContext) {
    const injections = isNil(nameOrDependencies)
      ? []
      : Array.isArray(nameOrDependencies)
        ? ((nameOrDependencies as Injection[]).map(dep =>
            typeof dep === 'object' ? dep : ({ key: dep } as KeyWithOptions),
          ) as Injection[])
        : []
    const name = isNil(nameOrDependencies)
      ? undefined
      : isNamedKey(nameOrDependencies)
        ? (nameOrDependencies as Key)
        : undefined

    if (context.kind === 'class') {
      const t = target as TFunction

      if (key !== undefined && !isNamedKey(key)) {
        throw new ErrInvalidBinding(
          `@Bean when used on a class, it only accepts injection named qualifiers of type string or symbol.\n` +
            `Received: ${typeof key}.\n` +
            `Check decorator on class '${context.name}'.`,
        )
      }

      const metadata = getOrCreateBeanMetadata(context.metadata)

      typeRegistrar.configure(t, {
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

    if (isNil(key)) {
      throw new ErrInvalidBinding(
        '@Bean when used on a @Configuration class method, it must receive a valid key.\n' +
          `Current value is: ${String(key)}.\n` +
          `Check the decorators on method '${String(context.name)}' on class '${target.constructor.name}'.`,
      )
    }

    const metadata = getOrCreateBeanMetadata(context.metadata)
    const type = typeof key === 'function' ? key : undefined
    const actualKey = typeof name === 'undefined' ? key : name

    configureBean(metadata, context.name, {
      dependencies: injections,
      key: actualKey,
      type,
    } as Partial<ConfigurationProviderOptions>)
  }
}
