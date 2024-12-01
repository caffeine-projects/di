import { Binder } from './Binder.js'
import { BindTo } from './Binder.js'
import { newBinding } from './Binding.js'
import { Binding } from './Binding.js'
import { BindingEntry, BindingRegistry } from './internal/BindingRegistry.js'
import { typeRegistrar } from './internal/TypeRegistrar.js'
import { ErrRepeatedInjectableConfiguration } from './internal/errors.js'
import { ErrScopeAlreadyRegistered } from './internal/errors.js'
import { ErrCircularReference } from './internal/errors.js'
import { ErrNoUniqueInjectionForKey } from './internal/errors.js'
import { ErrNoResolutionForKey } from './internal/errors.js'
import { ErrInvalidBinding } from './internal/errors.js'
import { solutions } from './internal/errors.js'
import { ErrScopeNotRegistered } from './internal/errors.js'
import { AfterInitInterceptor } from './internal/interceptors/AfterInitInterceptor.js'
import { BeforeInitInterceptor } from './internal/interceptors/BeforeInitInterceptor.js'
import { ContainerScope } from './internal/scopes/ContainerScope.js'
import { EntrypointProvider } from './internal/EntrypointProvider.js'
import { BuiltInMetadataReader } from './internal/BuiltInMetadataReader.js'
import { MethodInjectorInterceptor } from './internal/interceptors/MethodInjectorInterceptor.js'
import { PostConstructInterceptor } from './internal/interceptors/PostConstructInterceptor.js'
import { PostResolutionInterceptor } from './PostResolutionInterceptor.js'
import { PropertiesInjectorInterceptor } from './internal/interceptors/PropertiesInjectorInterceptor.js'
import { providerFromKey } from './Provider.js'
import { LocalResolutionScope } from './internal/scopes/LocalResolutionScope.js'
import { ScopedProvider } from './internal/ScopedProvider.js'
import { SingletonScope } from './internal/scopes/SingletonScope.js'
import { SimpleKeyedProvider } from './internal/providers/SimpleKeyedProvider'
import { TransientScope } from './internal/scopes/TransientScope.js'
import { Lifecycle } from './Lifecycle.js'
import { PostProcessor } from './PostProcessor.js'
import { Resolver } from './Resolver.js'
import { Scope } from './Scope.js'
import { DefaultServiceLocator } from './ServiceLocator.js'
import { ServiceLocator } from './ServiceLocator.js'
import { keyStr } from './Key'
import { isNamedKey, Key } from './Key'
import { KeyWithOptions } from './Key'
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
  readonly hooks: HookListener = new InternalHookListener()
  readonly namespace: string | symbol
  readonly parent?: DI
  protected readonly postProcessors = new Set<PostProcessor>()
  protected readonly filters: Filter[] = []
  protected readonly bindingRegistry = new BindingRegistry()
  protected readonly namedBindings = new Map<Identifier, Binding[]>()
  protected readonly multipleBeansRefCache = new Map<Key, Binding[]>()
  protected readonly scopeId: Identifier
  protected readonly metadataReader: MetadataReader
  protected readonly lazy?: boolean
  protected readonly lateBind?: boolean
  protected readonly overriding?: boolean

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
      throw new ErrScopeAlreadyRegistered(scopeId)
    }

    DI.Scopes.set(scopeId, scope)
  }

  static unbindScope(scopeId: Identifier): void {
    DI.Scopes.delete(notNil(scopeId))
  }

  static hasScope(scopeId: Identifier): boolean {
    return DI.Scopes.has(scopeId)
  }

  static getScope<T extends Scope = Scope>(scopeId: Identifier): T | undefined {
    return DI.Scopes.get(scopeId) as T
  }

  static async scan(paths: string[]): Promise<void> {
    notNil(paths)
    await Promise.all(paths.map(path => loadModule(path)))
  }

  static arg(key: Key, options?: Omit<KeyWithOptions, 'key'>): KeyWithOptions {
    notNil(key)
    return { key, ...options }
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
        container.bind(identifier).toKey(scopeType)
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

  configureBinding<T>(key: Key<T>, incoming: Binding<T>): void {
    notNil(key)
    notNil(incoming)

    const hasBag = incoming.injections.some(x => x.objectInjections && x.objectInjections.length > 0)

    if (hasBag) {
      if (incoming.rawProvider && !(incoming.rawProvider instanceof ConstructorDestructuringProvider)) {
        throw new ErrInvalidBinding(
          `Binding '${keyStr(key)}' contains constructor @Bag() parameters but is using a different provider. ` +
            solutions(
              `- Check if the component '${keyStr(key)}' is using a custom provider and remove it. ` +
                `When using constructor destructuring injection, 'ConstructorDestructuringProvider' need to be used`,
            ),
        )
      } else {
        incoming.rawProvider = new ConstructorDestructuringProvider(incoming.type as Ctor)
      }
    }

    const binding = { ...incoming, ...this.metadataReader.read(key) }
    const scopeId = binding.scopeId ? binding.scopeId : this.scopeId
    const rawProvider = providerFromKey(key, binding.rawProvider)

    notNil(rawProvider, `Could not determine a provider for key: ${keyStr(key)}`)

    if (rawProvider instanceof SimpleKeyedProvider) {
      const path = [key]
      let simpleKeyedProvider: SimpleKeyedProvider<any> | null = rawProvider
      const ctx: ResolutionContext = { container: this, key: key, binding }

      while (simpleKeyedProvider !== null) {
        const curKey: Key = simpleKeyedProvider.provide(ctx)

        if (path.includes(curKey)) {
          throw new ErrCircularReference(`Key registration cycle detected! ${[...path, curKey].join(' -> ')}`)
        }

        path.push(curKey)

        const binding: Binding | undefined = this.bindingRegistry.get(curKey)

        if (binding && binding.rawProvider instanceof SimpleKeyedProvider) {
          simpleKeyedProvider = binding.rawProvider
        } else {
          simpleKeyedProvider = null
        }
      }
    }

    const scope = rawProvider instanceof SimpleKeyedProvider ? DI.getScope(Lifecycle.TRANSIENT) : DI.getScope(scopeId)
    if (scope === undefined) {
      throw new ErrScopeNotRegistered(scopeId)
    }

    const hasPropertyInjections = binding.injectableProperties.size > 0
    const hasMethodInjections = binding.injectableMethods.size > 0
    const hasLookups = binding.lookupProperties.size > 0
    const chain: PostResolutionInterceptor<T>[] = []

    if (hasLookups && typeof key === 'function') {
      for (const [propertyKey, spec] of binding.lookupProperties) {
        const descriptor = Object.getOwnPropertyDescriptor(key.prototype, propertyKey)

        if (descriptor && typeof descriptor.get === 'function') {
          Object.defineProperty(key.prototype, propertyKey, {
            get: () => Resolver.resolveParam(this, key, spec, propertyKey),
          })
        } else {
          key.prototype[propertyKey] = () => Resolver.resolveParam(this, key, spec, propertyKey)
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
      DI.getScope(binding.scopeId)?.undo?.(binding)
    }

    binding.scopeId = scopeId
    binding.rawProvider = rawProvider
    binding.scopedProvider =
      chain.length == 0
        ? new ScopedProvider(scope, rawProvider)
        : new ScopedProvider(scope, new EntrypointProvider(rawProvider, chain))
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

    this.bindingRegistry.register(key, binding)
    this.mapNamed(binding)

    scope.configure?.(binding)
  }

  get<T, A = unknown>(key: Key<T>, args?: A): T {
    const bindings = this.getBindings<T>(key)

    if (bindings.length > 1) {
      for (const binding of bindings) {
        if (binding.primary) {
          return Resolver.resolve<T>(this, key, binding, args)
        }
      }

      throw new ErrNoUniqueInjectionForKey(key)
    }

    return Resolver.resolve<T>(this, key, bindings[0], args)
  }

  getRequired<T, A = unknown>(key: Key<T>, args?: A): T {
    const result = this.get(key, args)

    if (isNil(result)) {
      throw new ErrNoResolutionForKey(`Unable to resolve required injection for key '${keyStr(key)}'`)
    }

    return result
  }

  getMany<T, A = unknown>(key: Key<T>, args?: A): T[] {
    const bindings = this.getBindings(key)

    if (bindings.length === 0) {
      if (this.multipleBeansRefCache.has(key)) {
        const bindings = this.multipleBeansRefCache.get(key) as Binding[]
        const resolved = new Array(bindings.length)
        for (let i = 0; i < bindings.length; i++) {
          resolved[i] = Resolver.resolve(this, key, bindings[i], args)
        }

        return resolved
      }

      let entries = this.search(tk => tk !== key && key.isPrototypeOf(tk))

      if (entries.length === 0) {
        entries = this.search((_tk, binding) => binding.type === key)
      }

      if (entries.length === 0) {
        return []
      } else {
        this.multipleBeansRefCache.set(
          key,
          entries.map(entry => entry.binding),
        )
      }

      const resolved = new Array<T>(entries.length)
      for (let i = 0; i < entries.length; i++) {
        resolved[i] = Resolver.resolve<T>(this, key, entries[i].binding, args)
      }

      return resolved
    }

    const resolved = new Array<T>(bindings.length)
    for (let i = 0; i < bindings.length; i++) {
      resolved[i] = Resolver.resolve<T>(this, key, bindings[i], args)
    }

    return resolved
  }

  getAsync<T, A = unknown>(key: Key<T>, args?: A): Promise<T> {
    const bindings = this.getBindings<T>(key)

    if (bindings.length > 1) {
      for (const binding of bindings) {
        if (binding.primary) {
          return AsyncResolver.resolveAsync<T>(this, key, binding, args)
        }
      }

      throw new ErrNoUniqueInjectionForKey(key)
    }

    return AsyncResolver.resolveAsync<T>(this, key, bindings[0], args)
  }

  has<T>(key: Key<T>, checkParent = false): boolean {
    return this.bindingRegistry.has(key) || (checkParent && (this.parent || false) && this.parent.has(key, true))
  }

  search(predicate: <T>(key: Key<T>, binding: Binding) => boolean): BindingEntry[] {
    notNil(predicate)

    const result: BindingEntry[] = []

    for (const [key, registrations] of this.bindingRegistry.entries()) {
      if (predicate(key, registrations)) {
        result.push({ key: key, binding: registrations })
      }
    }

    return result
  }

  bind<T>(key: Key<T>): Binder<T> {
    notNil(key)

    const type = typeRegistrar.get(key)
    const binding = newBinding(type)

    this.configureBinding(key, binding)

    return new BindTo<T>(this, key, { ...binding })
  }

  unbind<T>(key: Key<T>): void {
    notNil(key)

    if (this.has(key)) {
      return this.unref(key)
    }

    if (this.parent) {
      this.parent.unbind(key)
    }
  }

  async unbindAsync<T>(key: Key<T>): Promise<void> {
    notNil(key)

    if (this.has(key)) {
      const bindings = this.getBindings(key)

      for (const binding of bindings) {
        if (binding.preDestroy) {
          await DI.preDestroyBinding(binding).finally(() => this.unref(key))
        }
      }

      this.unref(key)
    }

    if (this.parent) {
      return this.parent.unbindAsync(key)
    }

    return Promise.resolve()
  }

  rebind<T>(key: Key<T>): Binder<T> {
    this.unbind(key)
    return this.bind(key)
  }

  rebindAsync<T>(key: Key<T>): Promise<Binder<T>> {
    return this.unbindAsync(key).then(() => this.bind(key))
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

    for (const [key, binding] of this.bindingRegistry.entries()) {
      if (binding.scopeId === Lifecycle.CONTAINER) {
        child.bindingRegistry.register(key, newBinding({ ...binding, id: undefined }))
      }
    }

    DI.bindInternalComponents(child)

    return child
  }

  getBindings<T>(key: Key<T>): Binding<T>[] {
    const binding = this.bindingRegistry.get(key)
    if (binding) {
      return [binding]
    }

    if (this.parent) {
      return this.parent.getBindings(key)
    }

    if (isNamedKey(key)) {
      return this.namedBindings.get(key) || []
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
      DI.getScope(binding.scopeId)?.remove(binding)
    }
  }

  resetInstance(key: Key): void {
    notNil(key)

    const bindings = this.getBindings(key)

    for (const binding of bindings) {
      DI.getScope(binding.scopeId)?.remove(binding)
    }
  }

  async resetInstanceAsync(key: Key): Promise<void> {
    notNil(key)

    const bindings = this.getBindings(key)

    for (const binding of bindings) {
      if (binding.preDestroy) {
        await DI.preDestroyBinding(binding).finally(() => this.unref(key))
      }

      DI.getScope(binding.scopeId)?.remove(binding)
    }
  }

  initInstances(): void {
    for (const [key, binding] of this.bindingRegistry.entries()) {
      if (
        !binding.lazy &&
        (binding.scopeId === Lifecycle.SINGLETON ||
          binding.scopeId === Lifecycle.CONTAINER ||
          binding.scopeId === Lifecycle.REFRESH)
      ) {
        Resolver.resolve(this, key, binding)
      }
    }
  }

  dispose(): Promise<void> {
    const destroyers: Promise<void | RejectionWrapper>[] = []
    const keys: Key[] = []

    for (const [key, binding] of this.bindingRegistry.entries()) {
      keys.push(key)

      if (binding.preDestroy) {
        destroyers.push(DI.preDestroyBinding(binding).catch(err => new RejectionWrapper(err)))
      }
    }

    return Promise.all(destroyers)
      .then(results => {
        for (const k of keys) {
          this.resetInstance(k)
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
    for (const [key, binding] of typeRegistrar.entries()) {
      this.hooks.emit('onSetup', { key: key, binding })

      if (!this.isRegistrable(binding) || !this.filter(key, binding)) {
        this.hooks.emit('onBindingNotRegistered', { key: key, binding })
        continue
      }

      const pass = binding.conditionals.every(conditional => conditional({ container: this, key: key, binding }))

      if (pass) {
        this.configureBinding(key, binding)
        this.hooks.emit('onBindingRegistered', { key: key, binding })
      } else {
        if (binding.configuration) {
          for (const tk of binding.keysProvided) {
            typeRegistrar.deleteBean(tk)
          }
        }

        this.hooks.emit('onBindingNotRegistered', { key: key, binding })
      }
    }

    for (const [key, binding] of typeRegistrar.beans()) {
      this.hooks.emit('onSetup', { key: key, binding })

      if (!this.isRegistrable(binding) || !this.filter(key, binding)) {
        this.hooks.emit('onBindingNotRegistered', { key: key, binding })
        continue
      }

      const pass =
        binding.conditionals === undefined
          ? true
          : binding.conditionals.every(conditional => conditional({ container: this, key: key, binding }))

      if (pass) {
        if (this.has(key) && !this.overriding) {
          throw new ErrRepeatedInjectableConfiguration(
            `Found multiple beans with the same injection key '${keyStr(key)}' configured at '${binding.configuredBy}'`,
          )
        }

        this.configureBinding(key, binding)
        this.hooks.emit('onBindingRegistered', { key: key, binding })
      } else {
        this.hooks.emit('onBindingNotRegistered', { key: key, binding })
      }
    }

    DI.bindInternalComponents(this)

    this.hooks.emit('onSetupComplete')
  }

  *configurationBeans(): IterableIterator<Key> {
    for (const [key, binding] of this.bindingRegistry.entries()) {
      if (binding.configuration) {
        yield key
      }
    }
  }

  types(): IterableIterator<[Key, Binding]> {
    return typeRegistrar.entries()
  }

  entries(): IterableIterator<[Key, Binding]> {
    return this.bindingRegistry.entries()
  }

  qualifiers(): IterableIterator<[Identifier, Binding[]]> {
    return this.namedBindings.entries()
  }

  toString(): string {
    return containerToString(this)
  }

  [Symbol.iterator](): IterableIterator<[Key, Binding]> {
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

  protected unref(key: Key) {
    const bindings = this.getBindings(key)

    this.bindingRegistry.delete(key)
    this.multipleBeansRefCache.delete(key)

    if (isNamedKey(key)) {
      this.namedBindings.delete(key)
    }

    for (const binding of bindings) {
      DI.getScope(binding.scopeId)?.remove(binding)
    }
  }

  protected filter(key: Key, binding: Binding): boolean {
    return this.filters.every(filter => !filter({ key: key, binding }))
  }
}
