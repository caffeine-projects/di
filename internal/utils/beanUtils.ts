import { keyStr } from '../../Key'
import { KeyWithOptions } from '../../Key'
import { Key } from '../../Key'
import { ErrRepeatedInjectableConfiguration } from '../errors.js'
import { Identifier } from '../types.js'
import { Conditional } from '../../decorators/ConditionalOn'
import { PostResolutionInterceptor } from '../../PostResolutionInterceptor'

const BeanWeakMap = new WeakMap()

export interface ConfigurationProviderOptions {
  scopeId: Identifier
  key: Key
  dependencies: KeyWithOptions[]
  conditionals: Conditional[]
  names: Identifier[]
  type: Function
  primary: boolean
  late: boolean
  lazy: boolean
  options: object
  byPassPostProcessors: boolean
  interceptors: PostResolutionInterceptor[]
}

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
      `Found repeated qualifiers for bean '${actual.key ? keyStr(actual.key) : ''}' on method '${String(
        method,
      )}'. Qualifiers found: ${newNames.map(x => keyStr(x)).join(', ')}`,
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
  injectableProperties: Map<Identifier, KeyWithOptions<unknown>>
  injectableMethods: Map<Identifier, KeyWithOptions<unknown>[]>
  lookupProperties: Map<Identifier, KeyWithOptions<unknown>>
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
