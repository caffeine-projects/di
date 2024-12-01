import { Binding } from '../Binding.js'
import { Key } from '../Key'
import { notNil } from './utils/notNil.js'

export interface BindingEntry {
  key: Key
  binding: Binding
}

export class BindingRegistry {
  private readonly _types: Map<Key, Binding> = new Map()

  register<T>(Key: Key<T>, binding: Binding<T>): void {
    notNil(Key)
    notNil(binding)
    notNil(binding.id)

    const entry = this.getEntry(Key)

    this._types.set(Key, { ...entry, ...binding })
  }

  get<T>(Key: Key<T>): Binding<T> | undefined {
    return this._types.get(Key)
  }

  has(Key: Key): boolean {
    return this._types.has(Key)
  }

  entries(): IterableIterator<[Key<unknown>, Binding]> {
    return this._types.entries()
  }

  toArray(): BindingEntry[] {
    return Array.from(this._types.entries()).map(([Key, registration]) => ({ key: Key, binding: registration }))
  }

  delete(Key: Key): boolean {
    return this._types.delete(Key)
  }

  clear(): void {
    this._types.clear()
  }

  size(): number {
    return this._types.size
  }

  private getEntry(Key: Key<unknown>): Binding {
    const entry = this._types.get(Key)

    if (entry) {
      return entry
    }

    this._types.set(Key, {} as Binding)

    return this._types.get(Key) as Binding
  }
}
