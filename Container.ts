import { Identifier } from './internal/types.js'
import { Key } from './Key'
import { Binding } from './Binding.js'
import { BindingEntry } from './internal/BindingRegistry.js'
import { Binder } from './Binder.js'
import { DI } from './DI.js'
import { Lifecycle } from './Lifecycle.js'
import { MetadataReader } from './MetadataReader.js'
import { HookListener } from './HookListener.js'
import { Filter } from './Filter.js'
import { PostProcessor } from './PostProcessor.js'

export interface ContainerOptions {
  namespace: Identifier
  scopeId: Identifier
  lazy?: boolean
  lateBind?: boolean
  overriding?: boolean
  metadataReader?: MetadataReader
}

export const InitialOptions: ContainerOptions = {
  namespace: '',
  scopeId: Lifecycle.SINGLETON,
}

export interface Container {
  readonly namespace: Identifier
  readonly parent?: DI
  readonly [Symbol.toStringTag]: string
  readonly size: number
  readonly hooks: HookListener

  configureBinding<T>(key: Key<T>, incoming: Binding<T>): void

  get<T, A = unknown>(key: Key<T>, args?: A): T

  getRequired<T, A = unknown>(key: Key<T>, args?: A): T

  getMany<T, A = unknown>(key: Key<T>, args?: A): T[]

  getAsync<T, A = unknown>(key: Key<T>, args?: A): Promise<T>

  has<T>(key: Key<T>, checkParent?: boolean): boolean

  search(predicate: <T>(key: Key<T>, binding: Binding) => boolean): BindingEntry[]

  bind<T>(key: Key<T>): Binder<T>

  unbind<T>(key: Key<T>): void

  unbindAsync<T>(key: Key<T>): Promise<void>

  rebind<T>(key: Key<T>): Binder<T>

  rebindAsync<T>(key: Key<T>): Promise<Binder<T>>

  newChild(): Container

  getBindings<T>(key: Key<T>): Binding<T>[]

  addPostProcessor(postProcessor: PostProcessor): void

  removePostProcessor(posProcessor: PostProcessor): void

  removeAllPostProcessors(): void

  clear(): void

  resetInstances(): void

  resetInstance(key: Key): void

  resetInstanceAsync(key: Key): Promise<void>

  initInstances(): void

  dispose(): Promise<void>

  addFilters(...filters: Filter[]): void

  setup(): void

  configurationBeans(): IterableIterator<Key>

  types(): IterableIterator<[Key, Binding]>

  entries(): IterableIterator<[Key, Binding]>

  qualifiers(): IterableIterator<[Identifier, Binding[]]>

  toString(): string

  [Symbol.iterator](): IterableIterator<[Key, Binding]>
}
