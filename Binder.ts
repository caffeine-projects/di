import { BinderOptions } from './BinderOptions.js'
import { BindToOptions } from './BinderOptions.js'
import { Provider } from './Provider.js'
import { Key } from './Key'
import { isNamedKey } from './Key'
import { keyStr } from './Key'
import { KeyWithOptions } from './Key'
import { Binding } from './Binding.js'
import { check } from './internal/utils/check.js'
import { notNil } from './internal/utils/notNil.js'
import { ErrInvalidBinding } from './internal/errors.js'
import { ResolutionContext } from './ResolutionContext.js'
import { ClassProvider } from './internal/providers/ClassProvider.js'
import { ValueProvider } from './internal/providers/ValueProvider.js'
import { SimpleKeyedProvider } from './internal/providers/SimpleKeyedProvider'
import { FactoryProvider } from './internal/providers/FactoryProvider.js'
import { Ctor } from './internal/types.js'
import { Container } from './Container.js'
import { FunctionProvider } from './internal/providers/FunctionProvider.js'

export interface Binder<T> {
  toClass(ctor: Ctor<T>): BinderOptions<T>

  toSelf(): BinderOptions<T>

  toValue(value: T): BinderOptions<T>

  toKey(key: Key): BinderOptions<T>

  toFactory(factory: (ctx: ResolutionContext) => T): BinderOptions<T>

  toProvider(provider: Provider<T>): BinderOptions<T>

  toFunction(fn: (...args: any[]) => unknown, injections: KeyWithOptions[]): BinderOptions<T>
}

export class BindTo<T> implements Binder<T> {
  constructor(
    private readonly container: Container,
    private readonly key: Key<T>,
    private readonly binding: Binding<T>,
  ) {}

  toClass(ctor: Ctor<T>): BindToOptions<T> {
    check(
      typeof ctor === 'function',
      `Binding .toClass() parameter must be class reference. Received: '${typeof ctor}'`,
    )

    this.binding.rawProvider = new ClassProvider(ctor)
    this.container.configureBinding(this.key, this.binding)

    return new BindToOptions<T>(this.container, this.key, this.binding)
  }

  toSelf(): BindToOptions<T> {
    if (isNamedKey(this.key)) {
      throw new ErrInvalidBinding(
        '.toSelf() cannot be used when binding key is not a class type. ' +
          `Current key is: '${keyStr(this.key)}' of type '${typeof this.key}'`,
      )
    }

    return this.toClass(this.key as Ctor)
  }

  toValue(value: T): BinderOptions<T> {
    this.binding.rawProvider = new ValueProvider(value)
    this.container.configureBinding(this.key, this.binding)

    return new BindToOptions<T>(this.container, this.key, this.binding)
  }

  toKey(key: Key): BinderOptions<T> {
    notNil(key)

    this.binding.rawProvider = new SimpleKeyedProvider(key)
    this.container.configureBinding(this.key, this.binding)

    return new BindToOptions<T>(this.container, this.key, this.binding)
  }

  toFactory(factory: (ctx: ResolutionContext) => T): BinderOptions<T> {
    check(
      typeof factory === 'function',
      `Binding .toFactory() parameter must be function type. Received: '${typeof factory}'`,
    )
    check(
      factory.length <= 1,
      `Binding .toFactory() must receive a function with at most one argument, which is the provider context. Received a function with '${factory.length}' arguments.`,
    )

    this.binding.rawProvider = new FactoryProvider(factory)
    this.container.configureBinding(this.key, this.binding)

    return new BindToOptions<T>(this.container, this.key, this.binding)
  }

  toProvider(provider: Provider<T>): BinderOptions<T> {
    check(
      typeof provider === 'object' && 'provide' in provider,
      `Binding .toProvider() parameter must be a Provider<T> instance.`,
    )

    this.binding.rawProvider = provider
    this.container.configureBinding(this.key, this.binding)

    return new BindToOptions<T>(this.container, this.key, this.binding)
  }

  toFunction(fn: (...args: any[]) => unknown, injections: KeyWithOptions[]): BinderOptions<T> {
    check(typeof fn === 'function', `.toFunction() only accepts function types`)

    this.binding.rawProvider = new FunctionProvider(fn) as Provider<T>
    this.binding.injections = injections
    this.container.configureBinding(this.key, this.binding)

    return new BindToOptions<T>(this.container, this.key, this.binding)
  }
}
