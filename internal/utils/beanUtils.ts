import { tokenStr } from '../../Token.js'
import { ConfigurationProviderOptions } from '../../decorators/ConfigurationProviderOptions.js'
import { RepeatedInjectableConfigurationError } from '../errors.js'
import { TypeRegistrar } from '../TypeRegistrar.js'
import { Identifier } from '../types.js'

const Def: Partial<ConfigurationProviderOptions> = {
  dependencies: [],
  conditionals: [],
  interceptors: [],
  names: [],
}

export function configureBean(
  target: Function,
  method: string | symbol,
  configurations: Partial<ConfigurationProviderOptions>,
): void {
  const factories = TypeRegistrar.getFactories(target) || new Map<Identifier, ConfigurationProviderOptions>()
  const actual = factories.get(method) || Def
  const interceptors = [...(actual.interceptors || []), ...(configurations.interceptors || [])]
  const newNames = configurations.names || []
  const existingNames = actual.names || []

  if (existingNames.some(value => newNames.includes(value))) {
    throw new RepeatedInjectableConfigurationError(
      `Found repeated qualifiers for bean '${actual.token ? tokenStr(actual.token) : ''}' on method '${String(
        method,
      )}' at configuration class '${target.name}'. Qualifiers found: ${newNames.map(x => tokenStr(x)).join(', ')}`,
    )
  }

  factories.set(method, {
    ...actual,
    ...configurations,
    interceptors,
    names: [...existingNames, ...newNames],
  })

  TypeRegistrar.setFactories(target, factories)
}

export function getBeanConfiguration(target: Function, method: string | symbol): Partial<ConfigurationProviderOptions> {
  const factories = TypeRegistrar.getFactories(target) || new Map<Identifier, Partial<ConfigurationProviderOptions>>()
  return factories.get(method) || Def
}
