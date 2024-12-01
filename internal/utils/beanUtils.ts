import { tokenStr } from '../../Token.js'
import { TokenDescriptor } from '../../Token.js'
import { ConfigurationProviderOptions } from '../../decorators/ConfigurationProviderOptions.js'
import { ErrRepeatedInjectableConfiguration } from '../errors.js'
import { Identifier } from '../types.js'

const BeanWeakMap = new WeakMap()

const Def: Partial<ConfigurationProviderOptions> = {
  dependencies: [],
  conditionals: [],
  interceptors: [],
  names: [],
}

export function configureBean(
  metadata: Metadata,
  method: string | symbol,
  configurations: Partial<ConfigurationProviderOptions>,
): void {
  const actual = metadata.methods.get(method) || Def
  const interceptors = [...(actual.interceptors || []), ...(configurations.interceptors || [])]
  const newNames = configurations.names || []
  const existingNames = actual.names || []

  if (existingNames.some(value => newNames.includes(value))) {
    throw new ErrRepeatedInjectableConfiguration(
      `Found repeated qualifiers for bean '${actual.token ? tokenStr(actual.token) : ''}' on method '${String(
        method,
      )}'. Qualifiers found: ${newNames.map(x => tokenStr(x)).join(', ')}`,
    )
  }

  metadata.methods.set(method, <ConfigurationProviderOptions>{
    ...actual,
    ...configurations,
    interceptors,
    names: [...existingNames, ...newNames],
  })
}

export interface Metadata {
  methods: Map<Identifier, ConfigurationProviderOptions>
  injectableProperties: Map<Identifier, TokenDescriptor<unknown>>
  injectableMethods: Map<Identifier, TokenDescriptor<unknown>[]>
  lookupProperties: Map<Identifier, TokenDescriptor<unknown>>
  postConstruct: string | symbol | undefined
  preDestroy: string | symbol | undefined
}

export function getOrCreateBeanMetadata(metadata: object): Metadata {
  let meta = BeanWeakMap.get(metadata) as Metadata
  if (meta) {
    return meta
  }

  meta = {
    methods: new Map(),
    injectableProperties: new Map(),
    injectableMethods: new Map(),
    lookupProperties: new Map(),
    postConstruct: undefined,
    preDestroy: undefined,
  }

  BeanWeakMap.set(metadata, meta)

  return meta
}
