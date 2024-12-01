import { Injection } from '../Key'
import { KeyWithOptions } from '../Key'
import { Identifier } from '../internal/types'
import { Ctor } from '../internal/types'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils'
import { typeRegistrar } from '../internal/TypeRegistrar'
import { ErrInvalidBinding } from '../internal/errors'
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
    const injections: KeyWithOptions[] = deps.map(dep =>
      typeof dep === 'object' ? (dep as KeyWithOptions) : ({ key: dep } as KeyWithOptions),
    )
    const metadata = getOrCreateBeanMetadata(context.metadata)
    const beanConfiguration = metadata.methods
    const configurations = Array.from(beanConfiguration.entries()).map(([_, options]) => options)
    const keys = configurations.map(x => x.key)

    typeRegistrar.configure<T>(target, {
      injections: injections,
      namespace: config.namespace,
      configuration: true,
      keysProvided: keys,
    })

    for (const [method, factory] of beanConfiguration) {
      if (factory.key === undefined) {
        throw new ErrInvalidBinding(
          `No injection key defined for the bean configured on method '${String(method)}' at the configuration class '${
            target.name
          }'.\n` +
            solutions(
              `- Ensure the method '${String(method)}' is decorated with '@${Bean.name}' or '@${
                Injectable.name
              }' and has the injection key passed as a parameter`,
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
        type: factory.type || (typeof factory.key === 'function' ? factory.key : undefined),
        rawProvider: new BeanFactoryProvider(target as unknown as Ctor<T>, method, factory),
        options: factory.options,
        configuredBy: `${target.name}/${String(method)}`,
        byPassPostProcessors: factory.byPassPostProcessors,
        interceptors: [...factory.interceptors],
      })

      typeRegistrar.addBean(factory.key, { ...binding })
    }
  }
}
