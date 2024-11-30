import { Injection } from '../Token'
import { TokenDescriptor } from '../Token'
import { Identifier } from '../internal/types'
import { Ctor } from '../internal/types'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils'
import { TypeRegistrar } from '../internal/TypeRegistrar'
import { InvalidBindingError } from '../internal/errors'
import { solutions } from '../internal/errors'
import { Injectable } from './Injectable'
import { newBinding } from '../Binding'
import { isNil } from '../internal/utils/isNil'
import { BeanFactoryProvider } from '../internal/providers/BeanFactoryProvider'
import { Bean } from './Bean'

export interface ConfigurationOptions {
  namespace: Identifier
  lazy: boolean
  primary: boolean
  scopeId: Identifier
  late: boolean
}

export function Configuration<T>(): <TFunction extends Function>(
  target: TFunction,
  context: ClassDecoratorContext,
) => void
export function Configuration<T>(
  config: Partial<ConfigurationOptions>,
): <TFunction extends Function>(target: TFunction, context: ClassDecoratorContext) => void
export function Configuration<T>(
  injections: Injection[],
): <TFunction extends Function>(target: TFunction, context: ClassDecoratorContext) => void
export function Configuration<T>(
  config: Partial<ConfigurationOptions>,
  injections: Injection[],
): <TFunction extends Function>(target: TFunction, context: ClassDecoratorContext) => void
export function Configuration<T>(
  configOrInjections?: Partial<ConfigurationOptions> | Injection[],
  dependencies: Injection[] = [],
) {
  return function <TFunction extends Function>(target: TFunction, context: ClassDecoratorContext) {
    const config: Partial<ConfigurationOptions> = Array.isArray(configOrInjections) ? {} : (configOrInjections ?? {})
    const deps = Array.isArray(configOrInjections) ? configOrInjections : dependencies
    const injections: TokenDescriptor[] = deps.map(dep =>
      typeof dep === 'object' ? (dep as TokenDescriptor) : { token: dep },
    )
    const metadata = getOrCreateBeanMetadata(context.metadata)
    const beanConfiguration = metadata.methods
    const configurations = Array.from(beanConfiguration.entries()).map(([_, options]) => options)
    const tokens = configurations.map(x => x.token)

    TypeRegistrar.configure<T>(target, {
      injections: injections,
      namespace: config.namespace,
      configuration: true,
      tokensProvided: tokens,
    })

    for (const [method, factory] of beanConfiguration) {
      if (factory.token === undefined) {
        throw new InvalidBindingError(
          `No injection token defined for bean configured on method '${String(method)}' at the configuration class '${
            target.name
          }'.` +
            solutions(
              `- Ensure the method '${String(method)}' is decorated with '@${Bean.name}' or '@${
                Injectable.name
              }' and has the injection token passed as a parameter`,
            ),
        )
      }

      const binding = newBinding({
        injections: [...factory.dependencies],
        namespace: config.namespace,
        lazy: isNil(config.lazy) ? factory.lazy : config.lazy,
        primary: isNil(config.primary) ? factory.primary : config.primary,
        scopeId: isNil(config.scopeId) ? factory.scopeId : config.scopeId,
        late: isNil(config.late) ? factory.late : config.late,
        conditionals: [...factory.conditionals],
        names: [...factory.names],
        type: factory.type || (typeof factory.token === 'function' ? factory.token : undefined),
        rawProvider: new BeanFactoryProvider(target as unknown as Ctor<T>, method, factory),
        options: factory.options,
        configuredBy: `${target.name}/${String(method)}`,
        byPassPostProcessors: factory.byPassPostProcessors,
        interceptors: [...factory.interceptors],
      })

      TypeRegistrar.addBean(factory.token, { ...binding })
    }
  }
}
