import { newBinding } from '../Binding.js'
import { BeanFactoryProvider } from '../internal/providers/BeanFactoryProvider.js'
import { getParamTypes } from '../internal/utils/getParamTypes.js'
import { isNil } from '../internal/utils/isNil.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'
import { Ctor } from '../internal/types.js'
import { Identifier } from '../internal/types.js'
import { InvalidBindingError } from '../internal/errors.js'
import { solutions } from '../internal/errors.js'
import { ConfigurationProviderOptions } from './ConfigurationProviderOptions.js'
import { Bean } from './Bean.js'
import { Injectable } from './Injectable.js'

export interface ConfigurationOptions {
  namespace: Identifier
  lazy: boolean
  primary: boolean
  scopeId: Identifier
  late: boolean
}

export function Configuration<T>(config: Partial<ConfigurationOptions> = {}): ClassDecorator {
  return function (target) {
    const beanConfiguration =
      (TypeRegistrar.getFactories(target) as Map<Identifier, ConfigurationProviderOptions>) ||
      new Map<Identifier, ConfigurationProviderOptions>()
    const configurations = Array.from(beanConfiguration.entries()).map(([_, options]) => options)
    const tokens = configurations.map(x => x.token)

    TypeRegistrar.configure<T>(target, {
      injections: getParamTypes(target),
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
        configuredBy: `${target.name}${String(method)}`,
        byPassPostProcessors: factory.byPassPostProcessors,
        interceptors: [...factory.interceptors],
      })

      TypeRegistrar.addBean(factory.token, { ...binding })
    }
  }
}
