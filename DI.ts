import { Binder } from './Binder.js'
import { BindTo } from './Binder.js'
import { newBinding } from './Binding.js'
import { Binding } from './Binding.js'
import { BindingEntry, BindingRegistry } from './internal/BindingRegistry.js'
import { TypeRegistrar } from './internal/TypeRegistrar.js'
import { RepeatedInjectableConfigurationError } from './internal/errors.js'
import { ScopeAlreadyRegisteredError } from './internal/errors.js'
import { ScopeNotRegisteredError } from './internal/errors.js'
import { CircularReferenceError } from './internal/errors.js'
import { NoUniqueInjectionForTokenError } from './internal/errors.js'
import { NoResolutionForTokenError } from './internal/errors.js'
import { InvalidBindingError } from './internal/errors.js'
import { solutions } from './internal/errors.js'
import { AfterInitInterceptor } from './internal/interceptors/AfterInitInterceptor.js'
import { BeforeInitInterceptor } from './internal/interceptors/BeforeInitInterceptor.js'
import { ContainerScope } from './internal/scopes/ContainerScope.js'
import { EntrypointProvider } from './internal/EntrypointProvider.js'
import { BuiltInMetadataReader } from './internal/BuiltInMetadataReader.js'
import { MethodInjectorInterceptor } from './internal/interceptors/MethodInjectorInterceptor.js'
import { PostConstructInterceptor } from './internal/interceptors/PostConstructInterceptor.js'
import { PostResolutionInterceptor } from './PostResolutionInterceptor.js'
import { PropertiesInjectorInterceptor } from './internal/interceptors/PropertiesInjectorInterceptor.js'
import { providerFromToken } from './Provider.js'
import { LocalResolutionScope } from './internal/scopes/LocalResolutionScope.js'
import { ScopedProvider } from './internal/ScopedProvider.js'
import { SingletonScope } from './internal/scopes/SingletonScope.js'
import { TokenProvider } from './internal/providers/TokenProvider.js'
import { TransientScope } from './internal/scopes/TransientScope.js'
import { Lifecycle } from './Lifecycle.js'
import { PostProcessor } from './PostProcessor.js'
import { Resolver } from './Resolver.js'
import { Scope } from './Scope.js'
import { DefaultServiceLocator } from './ServiceLocator.js'
import { ServiceLocator } from './ServiceLocator.js'
import { tokenStr } from './Token.js'
import { isNamedToken, Token } from './Token.js'
import { TokenSpec } from './Token.js'
import { isNil } from './internal/utils/isNil.js'
import { loadModule } from './internal/utils/loadModule.js'
import { notNil } from './internal/utils/notNil.js'
import { RequestScope } from './internal/scopes/RequestScope.js'
import { RefreshScope } from './internal/scopes/RefreshScope.js'
import { Filter } from './Filter.js'
import { MetadataReader } from './MetadataReader.js'
import { ResolutionContext } from './ResolutionContext.js'
import { Identifier } from './internal/types.js'
import { Ctor } from './internal/types.js'
import { Container } from './Container.js'
import { InitialOptions } from './Container.js'
import { ContainerOptions } from './Container.js'
import { containerToString } from './internal/utils/containerToString.js'
import { InternalHookListener } from './internal/InternalHookListener.js'
import { HookListener } from './HookListener.js'
import { RejectionWrapper } from './internal/RejectionWrapper.js'
import { ConstructorDestructuringProvider } from './internal/providers/ConstructorDestructuringProvider.js'
import { AsyncResolver } from './AsyncResolver.js'

export class DI implements Container {
  protected static readonly Scopes = new Map(DI.builtInScopes().entries())

  protected readonly postProcessors = new Set<PostProcessor>()
  protected readonly filters: Filter[] = []
  protected readonly bindingRegistry = new BindingRegistry()
  protected readonly namedBindings = new Map<Identifier, Binding[]>()
  protected readonly multipleBeansRefCache = new Map<Token, Binding[]>()
  protected readonly scopeId: Identifier
  protected readonly metadataReader: MetadataReader
  protected readonly lazy?: boolean
  protected readonly lateBind?: boolean
  protected readonly overriding?: boolean

  readonly hooks: HookListener = new InternalHookListener()
  readonly namespace: string | symbol
  readonly parent?: DI

  constructor(options: Partial<ContainerOptions> | string | symbol = '', parent?: DI) {
    const opts =
      typeof options === 'string' || typeof options === 'symbol'
        ? { ...InitialOptions, namespace: options }
        : { ...InitialOptions, ...options }

    this.parent = parent
    this.namespace = opts.namespace || ''
    this.lazy = opts.lazy
    this.lateBind = opts.lateBind
    this.overriding = opts.overriding
    this.scopeId = opts.scopeId || Lifecycle.SINGLETON
    this.metadataReader = opts.metadataReader || new BuiltInMetadataReader()
  }

  get [Symbol.toStringTag]() {
    return DI.name
  }

  get size(): number {
    return this.bindingRegistry.size()
  }

  static setup(options: Partial<ContainerOptions> | string | symbol = '', parent?: DI): DI {
    const di = new DI(options, parent)
    di.setup()

    return di
  }

  static bindScope(scopeId: Identifier, scope: Scope): void {
    notNil(scopeId)
    notNil(scope)

    if (this.Scopes.has(scopeId)) {
      throw new ScopeAlreadyRegisteredError(scopeId)
    }

    DI.Scopes.set(scopeId, scope)
  }

  static unbindScope(scopeId: Identifier): void {
    DI.Scopes.delete(notNil(scopeId))
  }

  static hasScope(scopeId: Identifier): boolean {
    return DI.Scopes.has(scopeId)
  }

  static getScope<T extends Scope = Scope>(scopeId: Identifier): T {
    const scope = DI.Scopes.get(scopeId)

    if (scope === undefined) {
      throw new ScopeNotRegisteredError(scopeId)
    }

    return scope as T
  }

  static async scan(paths: string[]): Promise<void> {
    notNil(paths)
    await Promise.all(paths.map(path => loadModule(path)))
  }

  static arg(token: Token, options?: Omit<TokenSpec, 'token'>): TokenSpec {
    notNil(token)
    return { token, tokenType: token, ...options }
  }

  protected static async preDestroyBinding(binding: Binding): Promise<void> {
    const scope = DI.Scopes.get(binding.scopeId) as Scope
    return Promise.resolve(scope.cachedInstance<any>(binding)?.[binding.preDestroy as Identifier]())
  }

  protected static bindInternalComponents(container: DI) {
    if (!container.has(ServiceLocator)) {
      container.bind(ServiceLocator).toValue(new DefaultServiceLocator(container)).as(Lifecycle.SINGLETON)
    }

    for (const [identifier, scope] of DI.Scopes.entries()) {
      const scopeType = scope.constructor

      container.bind(scopeType).toValue(scope).singletonScoped().byPassPostProcessors()

      if (typeof identifier === 'symbol') {
        container.bind(identifier).toToken(scopeType)
      }
    }
  }

  protected static builtInScopes() {
    return new Map<Identifier, Scope>()
      .set(Lifecycle.SINGLETON, new SingletonScope())
      .set(Lifecycle.CONTAINER, new ContainerScope())
      .set(Lifecycle.LOCAL_RESOLUTION, new LocalResolutionScope())
      .set(Lifecycle.TRANSIENT, new TransientScope())
      .set(Lifecycle.REQUEST, new RequestScope())
      .set(Lifecycle.REFRESH, new RefreshScope())
  }

  configureBinding<T>(token: Token<T>, incoming: Binding<T>): void {
    notNil(token)
    notNil(incoming)

    const hasBag = incoming.injections.some(x => x.bag && x.bag.length > 0)

    if (hasBag) {
      if (incoming.rawProvider && !(incoming.rawProvider instanceof ConstructorDestructuringProvider)) {
        throw new InvalidBindingError(
          `Binding '${tokenStr(token)}' contains constructor @Bag() parameters but is using a different provider. ` +
            solutions(
              `- Check if the component '${tokenStr(token)}' is using a custom provider and remove it. ` +
                `When using constructor destructuring injection, 'ConstructorDestructuringProvider' need to be used`,
            ),
        )
      } else {
        incoming.rawProvider = new ConstructorDestructuringProvider(incoming.type as Ctor)
      }
    }

    const binding = { ...incoming, ...this.metadataReader.read(token) }
    const scopeId = binding.scopeId ? binding.scopeId : this.scopeId
    const rawProvider = providerFromToken(token, binding.rawProvider)

    notNil(rawProvider, `Could not determine a provider for token: ${tokenStr(token)}`)

    if (rawProvider instanceof TokenProvider) {
      const path = [token]
      let tokenProvider: TokenProvider<any> | null = rawProvider
      const ctx: ResolutionContext = { container: this, token, binding }

      while (tokenProvider !== null) {
        const currentToken: Token = tokenProvider.provide(ctx)

        if (path.includes(currentToken)) {
          throw new CircularReferenceError(`Token registration cycle detected! ${[...path, currentToken].join(' -> ')}`)
        }

        path.push(currentToken)

        const binding: Binding | undefined = this.bindingRegistry.get(currentToken)

        if (binding && binding.rawProvider instanceof TokenProvider) {
          tokenProvider = binding.rawProvider
        } else {
          tokenProvider = null
        }
      }
    }

    const scope = rawProvider instanceof TokenProvider ? DI.getScope(Lifecycle.TRANSIENT) : DI.getScope(scopeId)
    const hasPropertyInjections = binding.injectableProperties.size > 0
    const hasMethodInjections = binding.injectableMethods.size > 0
    const hasLookups = binding.lookupProperties.size > 0
    const chain: PostResolutionInterceptor<T>[] = []

    if (hasLookups && typeof token === 'function') {
      for (const [propertyKey, spec] of binding.lookupProperties) {
        const descriptor = Object.getOwnPropertyDescriptor(token.prototype, propertyKey)

        if (descriptor && typeof descriptor.get === 'function') {
          Object.defineProperty(token.prototype, propertyKey, {
            get: () => Resolver.resolveParam(this, token, spec, propertyKey),
          })
        } else {
          token.prototype[propertyKey] = () => Resolver.resolveParam(this, token, spec, propertyKey)
        }
      }
    }

    if (hasPropertyInjections) {
      chain.push(new PropertiesInjectorInterceptor())
    }

    if (hasMethodInjections) {
      chain.push(new MethodInjectorInterceptor())
    }

    for (const interceptor of binding.interceptors) {
      chain.push(interceptor)
    }

    if (!binding.byPassPostProcessors) {
      for (const postProcessor of this.postProcessors) {
        chain.push(new BeforeInitInterceptor(postProcessor))
      }
    }

    if (binding.postConstruct) {
      chain.push(new PostConstructInterceptor())
    }

    if (!binding.byPassPostProcessors) {
      for (const postProcessor of this.postProcessors) {
        chain.push(new AfterInitInterceptor(postProcessor))
      }
    }

    if (binding.scopeId && binding.scopeId !== scopeId) {
      DI.getScope(binding.scopeId).undo?.(binding)
    }

    binding.scopeId = scopeId
    binding.rawProvider = rawProvider
    binding.scopedProvider = new ScopedProvider(scope, new EntrypointProvider(rawProvider, chain))
    binding.late = binding.late === undefined ? this.lateBind : binding.late
    binding.lazy = binding.lazy =
      binding.lazy === undefined && this.lazy === undefined
        ? !(
            binding.scopeId === Lifecycle.SINGLETON ||
            binding.scopeId === Lifecycle.CONTAINER ||
            binding.scopeId === Lifecycle.REFRESH
          )
        : binding.lazy === undefined
          ? this.lazy
          : binding.lazy

    this.bindingRegistry.register(token, binding)
    this.mapNamed(binding)

    scope.configure?.(binding)
  }

  get<T, A = unknown>(token: Token<T>, args?: A): T {
    const bindings = this.getBindings<T>(token)

    if (bindings.length > 1) {
      for (const binding of bindings) {
        if (binding.primary) {
          return Resolver.resolve<T>(this, token, binding, args)
        }
      }

      throw new NoUniqueInjectionForTokenError(token)
    }

    return Resolver.resolve<T>(this, token, bindings[0], args)
  }

  getRequired<T, A = unknown>(token: Token<T>, args?: A): T {
    const result = this.get(token, args)

    if (isNil(result)) {
      throw new NoResolutionForTokenError(`Unable to resolve required injection for token '${tokenStr(token)}'`)
    }

    return result
  }

  getMany<T, A = unknown>(token: Token<T>, args?: A): T[] {
    const bindings = this.getBindings(token)

    if (bindings.length === 0) {
      if (this.multipleBeansRefCache.has(token)) {
        const bindings = this.multipleBeansRefCache.get(token) as Binding[]
        const resolved = new Array(bindings.length)
        for (let i = 0; i < bindings.length; i++) {
          resolved[i] = Resolver.resolve(this, token, bindings[i], args)
        }

        return resolved
      }

      let entries = this.search(tk => tk !== token && token.isPrototypeOf(tk))

      if (entries.length === 0) {
        entries = this.search((_tk, binding) => binding.type === token)
      }

      if (entries.length === 0) {
        return []
      } else {
        this.multipleBeansRefCache.set(
          token,
          entries.map(entry => entry.binding),
        )
      }

      const resolved = new Array(entries.length)
      for (let i = 0; i < entries.length; i++) {
        resolved[i] = Resolver.resolve(this, token, entries[i].binding, args)
      }

      return resolved
    }

    const resolved = new Array(bindings.length)
    for (let i = 0; i < bindings.length; i++) {
      resolved[i] = Resolver.resolve(this, token, bindings[i], args)
    }

    return resolved
  }

  getAsync<T, A = unknown>(token: Token<T>, args?: A): Promise<T> {
    const bindings = this.getBindings<T>(token)

    if (bindings.length > 1) {
      for (const binding of bindings) {
        if (binding.primary) {
          return AsyncResolver.resolveAsync<T>(this, token, binding, args)
        }
      }

      throw new NoUniqueInjectionForTokenError(token)
    }

    return AsyncResolver.resolveAsync<T>(this, token, bindings[0], args)
  }

  has<T>(token: Token<T>, checkParent = false): boolean {
    return this.bindingRegistry.has(token) || (checkParent && (this.parent || false) && this.parent.has(token, true))
  }

  search(predicate: <T>(token: Token<T>, binding: Binding) => boolean): BindingEntry[] {
    notNil(predicate)

    const result: BindingEntry[] = []

    for (const [token, registrations] of this.bindingRegistry.entries()) {
      if (predicate(token, registrations)) {
        result.push({ token, binding: registrations })
      }
    }

    return result
  }

  bind<T>(token: Token<T>): Binder<T> {
    notNil(token)

    const type = TypeRegistrar.get(token)
    const binding = newBinding(type)

    this.configureBinding(token, binding)

    return new BindTo<T>(this, token, { ...binding })
  }

  unbind<T>(token: Token<T>): void {
    notNil(token)

    if (this.has(token)) {
      return this.unref(token)
    }

    if (this.parent) {
      this.parent.unbind(token)
    }
  }

  async unbindAsync<T>(token: Token<T>): Promise<void> {
    notNil(token)

    if (this.has(token)) {
      const bindings = this.getBindings(token)

      for (const binding of bindings) {
        if (binding.preDestroy) {
          await DI.preDestroyBinding(binding).finally(() => this.unref(token))
        }
      }

      this.unref(token)
    }

    if (this.parent) {
      return this.parent.unbindAsync(token)
    }

    return Promise.resolve()
  }

  rebind<T>(token: Token<T>): Binder<T> {
    this.unbind(token)
    return this.bind(token)
  }

  rebindAsync<T>(token: Token<T>): Promise<Binder<T>> {
    return this.unbindAsync(token).then(() => this.bind(token))
  }

  newChild(): Container {
    const child = new DI(
      {
        lazy: this.lazy,
        scopeId: this.scopeId,
        lateBind: this.lateBind,
        namespace: this.namespace,
      },
      this,
    )

    child.addFilters(...this.filters)

    for (const value of this.postProcessors.values()) {
      child.addPostProcessor(value)
    }

    for (const [token, binding] of this.bindingRegistry.entries()) {
      if (binding.scopeId === Lifecycle.CONTAINER) {
        child.bindingRegistry.register(token, newBinding({ ...binding, id: undefined }))
      }
    }

    DI.bindInternalComponents(child)

    return child
  }

  getBindings<T>(token: Token<T>): Binding<T>[] {
    const binding = this.bindingRegistry.get(token)
    if (binding) {
      return [binding]
    }

    if (this.parent) {
      return this.parent.getBindings(token)
    }

    if (isNamedToken(token)) {
      return this.namedBindings.get(token) || []
    }

    return []
  }

  addPostProcessor(postProcessor: PostProcessor) {
    this.postProcessors.add(notNil(postProcessor))
  }

  removePostProcessor(posProcessor: PostProcessor) {
    this.postProcessors.delete(posProcessor)
  }

  removeAllPostProcessors() {
    this.postProcessors.clear()
  }

  clear(): void {
    this.bindingRegistry.clear()
  }

  resetInstances(): void {
    for (const [, binding] of this.bindingRegistry.entries()) {
      DI.getScope(binding.scopeId).remove(binding)
    }
  }

  resetInstance(token: Token): void {
    notNil(token)

    const bindings = this.getBindings(token)

    for (const binding of bindings) {
      DI.getScope(binding.scopeId).remove(binding)
    }
  }

  async resetInstanceAsync(token: Token): Promise<void> {
    notNil(token)

    const bindings = this.getBindings(token)

    for (const binding of bindings) {
      if (binding.preDestroy) {
        await DI.preDestroyBinding(binding).finally(() => this.unref(token))
      }

      DI.getScope(binding.scopeId).remove(binding)
    }
  }

  initInstances(): void {
    for (const [token, binding] of this.bindingRegistry.entries()) {
      if (
        !binding.lazy &&
        (binding.scopeId === Lifecycle.SINGLETON ||
          binding.scopeId === Lifecycle.CONTAINER ||
          binding.scopeId === Lifecycle.REFRESH)
      ) {
        Resolver.resolve(this, token, binding)
      }
    }
  }

  dispose(): Promise<void> {
    const destroyers: Promise<void | RejectionWrapper>[] = []
    const tokens: Token[] = []

    for (const [token, binding] of this.bindingRegistry.entries()) {
      tokens.push(token)

      if (binding.preDestroy) {
        destroyers.push(DI.preDestroyBinding(binding).catch(err => new RejectionWrapper(err)))
      }
    }

    return Promise.all(destroyers)
      .then(results => {
        for (const token of tokens) {
          this.resetInstance(token)
        }

        const rejections: RejectionWrapper[] = results.filter(x => x instanceof RejectionWrapper) as RejectionWrapper[]

        if (rejections.length === 0) {
          return
        }

        return Promise.reject(rejections.map(x => x.reason))
      })
      .finally(() => this.hooks.emit('onDisposed'))
  }

  addFilters(...filters: Filter[]) {
    this.filters.push(...notNil(filters))
  }

  setup(): void {
    for (const [token, binding] of TypeRegistrar.entries()) {
      this.hooks.emit('onSetup', { token, binding })

      if (!this.isRegistrable(binding) || !this.filter(token, binding)) {
        this.hooks.emit('onBindingNotRegistered', { token, binding })
        continue
      }

      const pass = binding.conditionals.every(conditional => conditional({ container: this, token, binding }))

      if (pass) {
        this.configureBinding(token, binding)
        this.hooks.emit('onBindingRegistered', { token, binding })
      } else {
        if (binding.configuration) {
          for (const tk of binding.tokensProvided) {
            TypeRegistrar.deleteBean(tk)
          }
        }

        this.hooks.emit('onBindingNotRegistered', { token, binding })
      }
    }

    for (const [token, binding] of TypeRegistrar.beans()) {
      this.hooks.emit('onSetup', { token, binding })

      if (!this.isRegistrable(binding) || !this.filter(token, binding)) {
        this.hooks.emit('onBindingNotRegistered', { token, binding })
        continue
      }

      const pass =
        binding.conditionals === undefined
          ? true
          : binding.conditionals.every(conditional => conditional({ container: this, token, binding }))

      if (pass) {
        if (this.has(token) && !this.overriding) {
          throw new RepeatedInjectableConfigurationError(
            `Found multiple beans with the same injection token '${tokenStr(token)}' configured at '${
              binding.configuredBy
            }'`,
          )
        }

        this.configureBinding(token, binding)
        this.hooks.emit('onBindingRegistered', { token, binding })
      } else {
        this.hooks.emit('onBindingNotRegistered', { token, binding })
      }
    }

    DI.bindInternalComponents(this)

    this.hooks.emit('onSetupComplete')
  }

  *configurationBeans(): IterableIterator<Token> {
    for (const [token, binding] of this.bindingRegistry.entries()) {
      if (binding.configuration) {
        yield token
      }
    }
  }

  types(): IterableIterator<[Token, Binding]> {
    return TypeRegistrar.entries()
  }

  entries(): IterableIterator<[Token, Binding]> {
    return this.bindingRegistry.entries()
  }

  qualifiers(): IterableIterator<[Identifier, Binding[]]> {
    return this.namedBindings.entries()
  }

  toString(): string {
    return containerToString(this)
  }

  [Symbol.iterator](): IterableIterator<[Token, Binding]> {
    return this.bindingRegistry.entries()
  }

  protected isRegistrable(binding: Binding): boolean {
    return binding.ready && binding.namespace === this.namespace && (binding.late == undefined || !binding.late)
  }

  protected mapNamed(binding: Binding): void {
    for (const name of binding.names) {
      const named = this.namedBindings.get(name)

      if (!named) {
        this.namedBindings.set(name, [binding])
      } else {
        if (!named.some(x => x.id === binding.id)) {
          named.push(binding)
          this.namedBindings.set(name, named)
        }
      }
    }
  }

  protected unref(token: Token) {
    const bindings = this.getBindings(token)

    this.bindingRegistry.delete(token)
    this.multipleBeansRefCache.delete(token)

    if (isNamedToken(token)) {
      this.namedBindings.delete(token)
    }

    for (const binding of bindings) {
      DI.getScope(binding.scopeId).remove(binding)
    }
  }

  protected filter(token: Token, binding: Binding): boolean {
    return this.filters.every(filter => !filter({ token, binding }))
  }
}
