import { Key } from './Key'
import { Binding } from './Binding.js'
import { notNil } from './internal/utils/notNil.js'
import { Lifecycle } from './Lifecycle.js'
import { ErrInvalidBinding } from './internal/errors.js'
import { Identifier } from './internal/types.js'
import { Container } from './Container.js'
import { DI } from './DI.js'
import { PostResolutionInterceptor } from './PostResolutionInterceptor.js'
import { ResolutionContext } from './ResolutionContext.js'
import { FunctionPostResolutionInterceptor } from './internal/interceptors/FunctionPostResolutionInterceptor.js'
import { check } from './internal/utils/check.js'

export interface BinderOptions<T> {
  as(scopeId: Identifier): BinderOptions<T>

  qualifiers(...names: Identifier[]): BinderOptions<T>

  lazy(lazy?: boolean): BinderOptions<T>

  primary(primary?: boolean): BinderOptions<T>

  singletonScoped(): BinderOptions<T>

  transientScoped(): BinderOptions<T>

  containerScoped(): BinderOptions<T>

  localScoped(): BinderOptions<T>

  requestScoped(): BinderOptions<T>

  refreshableScoped(): BinderOptions<T>

  byPassPostProcessors(): BinderOptions<T>

  intercept(interceptor: PostResolutionInterceptor<T>): BinderOptions<T>

  options<O extends object>(options: O): BinderOptions<T>
}

export class BindToOptions<T> implements BinderOptions<T> {
  constructor(
    private readonly container: Container,
    private readonly key: Key<T>,
    private readonly binding: Binding<T>,
  ) {}

  as(scopeId: Identifier): BinderOptions<T> {
    if (!DI.hasScope(notNil(scopeId))) {
      throw new ErrInvalidBinding(
        `Scope '${String(
          scopeId,
        )}' is not registered! Register the scope using the method 'DI.bindScope()' before using it.`,
      )
    }

    this.binding.scopeId = scopeId
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  qualifiers(...names: Identifier[]): BinderOptions<T> {
    this.binding.names = notNil(names)
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  lazy(lazy = true): BinderOptions<T> {
    this.binding.lazy = lazy
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  primary(primary = true): BinderOptions<T> {
    this.binding.primary = primary
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  singletonScoped(): BinderOptions<T> {
    this.binding.scopeId = Lifecycle.SINGLETON
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  transientScoped(): BinderOptions<T> {
    this.binding.scopeId = Lifecycle.TRANSIENT
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  containerScoped(): BinderOptions<T> {
    this.binding.scopeId = Lifecycle.CONTAINER
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  localScoped(): BinderOptions<T> {
    this.binding.scopeId = Lifecycle.LOCAL_RESOLUTION
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  refreshableScoped(): BinderOptions<T> {
    this.binding.scopeId = Lifecycle.REFRESH
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  requestScoped(): BinderOptions<T> {
    this.binding.scopeId = Lifecycle.REQUEST
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  byPassPostProcessors(): BinderOptions<T> {
    this.binding.byPassPostProcessors = true
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  intercept(
    interceptor: PostResolutionInterceptor<T> | ((instance: T, ctx: ResolutionContext) => T),
  ): BinderOptions<T> {
    this.binding.interceptors.push(
      notNil(typeof interceptor === 'function' ? new FunctionPostResolutionInterceptor(interceptor) : interceptor),
    )
    this.container.configureBinding(this.key, this.binding)

    return this
  }

  options<O extends object>(options: O): BinderOptions<T> {
    check(typeof options === 'object', `Options must be an object type. Received: '${typeof options}'`)

    this.binding.options = options
    this.container.configureBinding(this.key, this.binding)

    return this
  }
}
