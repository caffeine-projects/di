import { Binding } from '../../Binding.js'
import { keyStr } from '../../Key'
import { Provider } from '../../Provider.js'
import { Scope } from '../../Scope.js'
import { ResolutionContext } from '../../ResolutionContext.js'
import { ErrIllegalScopeState } from '../errors.js'
import { ErrOutOfScope } from '../errors.js'

export class RequestScope implements Scope {
  protected readonly _destructionCallbacks = new Map<number, () => Promise<void> | void>()
  private readonly _instances = new Map<number, unknown>()
  private _entered = false

  activate() {
    if (this._entered) {
      throw new ErrIllegalScopeState(
        'Request scoping block already in progress. ' + 'Make sure to start one request scope block per time.',
      )
    }

    this._entered = true
  }

  finish(): Promise<unknown> {
    if (!this._entered) {
      throw new ErrIllegalScopeState('No request scoping block is in progress.')
    }

    this._entered = false

    return Promise.all(
      Array.from(this._destructionCallbacks.values()).map(preDestroy => Promise.resolve(preDestroy())),
    ).finally(() => this._instances.clear())
  }

  cachedInstance<T>(binding: Binding): T | undefined {
    return this._instances.get(binding.id) as T | undefined
  }

  get<T>(ctx: ResolutionContext, provider: Provider<T>): T {
    if (!this._entered) {
      throw new ErrOutOfScope(`Cannot access the key '${keyStr(ctx.key)}' outside of a request scoping block.`)
    }

    if (this._instances.has(ctx.binding.id)) {
      return this._instances.get(ctx.binding.id) as T
    }

    const resolved = provider.provide(ctx)

    this._instances.set(ctx.binding.id, resolved)

    return resolved
  }

  remove(binding: Binding): void {
    this._instances.delete(binding.id)
  }

  configure(binding: Binding) {
    this._destructionCallbacks.set(binding.id, () => this.cachedInstance<any>(binding)?.[binding.preDestroy!]())
  }

  undo(binding: Binding) {
    this._destructionCallbacks.delete(binding.id)
  }
}
