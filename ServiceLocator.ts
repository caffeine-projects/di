import { Key } from './Key'
import { Container } from './Container.js'

export interface LocatorOptions<A = unknown> {
  args?: A
}

export abstract class ServiceLocator {
  abstract get<T, A = unknown>(key: Key<T>, options?: Partial<LocatorOptions<A>>): T

  abstract getMany<T, A = unknown>(key: Key<T>, options?: Partial<LocatorOptions<A>>): T[]

  abstract has(key: Key): boolean
}

export class DefaultServiceLocator extends ServiceLocator {
  constructor(private readonly container: Container) {
    super()
  }

  get<T, A = unknown>(key: Key<T>, options?: Partial<LocatorOptions<A>>): T {
    return this.container.get(key, options?.args)
  }

  getMany<T, A = unknown>(key: Key<T>, options?: Partial<LocatorOptions<A>>): T[] {
    return this.container.getMany(key, options?.args)
  }

  has(key: Key): boolean {
    return this.container.has(key)
  }
}
