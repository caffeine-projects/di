import { newId } from './internal/utils/newId.js'
import { PostResolutionInterceptor } from './PostResolutionInterceptor.js'
import { Provider } from './Provider.js'
import { Token } from './Token.js'
import { TokenSpec } from './Token.js'
import { Conditional } from './decorators/ConditionalOn.js'
import { Identifier } from './internal/types.js'

export interface Binding<T = any> {
  id: number
  injections: TokenSpec<unknown>[]
  injectableProperties: Map<Identifier, TokenSpec<unknown>>
  injectableMethods: Map<Identifier, TokenSpec<unknown>[]>
  lookupProperties: Map<Identifier, TokenSpec<unknown>>
  interceptors: PostResolutionInterceptor[]
  namespace: Identifier
  scopeId: Identifier
  names: Identifier[]
  rawProvider: Provider<T>
  scopedProvider: Provider<T>
  conditionals: Conditional[]
  configuredBy?: string
  type?: Function
  configuration?: boolean
  tokensProvided: Token[]
  primary?: boolean
  late?: boolean
  lazy?: boolean
  preDestroy?: Identifier
  postConstruct?: Identifier
  options?: object
  byPassPostProcessors?: boolean
  ready: boolean
}

export function newBinding<T>(initial: Partial<Binding<T>> = {}): Binding<T> {
  return {
    id: initial.id === undefined ? newId() : initial.id,
    injections: initial.injections || [],
    injectableProperties: initial.injectableProperties || new Map(),
    injectableMethods: initial.injectableMethods || new Map(),
    lookupProperties: initial.lookupProperties || new Map(),
    interceptors: initial.interceptors || [],
    namespace: initial.namespace || '',
    names: initial.names || [],
    conditionals: initial.conditionals || [],
    options: initial.options || {},
    configuredBy: initial.configuredBy,
    primary: initial.primary,
    lazy: initial.lazy,
    late: initial.late,
    preDestroy: initial.preDestroy,
    postConstruct: initial.postConstruct,
    configuration: initial.configuration,
    tokensProvided: initial.tokensProvided || [],
    type: initial.type,
    byPassPostProcessors: initial.byPassPostProcessors,
    scopeId: initial.scopeId!,
    scopedProvider: initial.scopedProvider!,
    rawProvider: initial.rawProvider!,
    ready: initial.ready ?? true,
  }
}
