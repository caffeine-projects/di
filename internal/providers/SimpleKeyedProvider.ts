import { Key } from '../../Key'
import { Provider } from '../../Provider.js'
import { ResolutionContext } from '../../ResolutionContext.js'

export class SimpleKeyedProvider<T> implements Provider<T> {
  constructor(private readonly key: Key<T>) {}

  provide(ctx: ResolutionContext): T {
    return ctx.container.get(this.key, ctx.args)
  }
}
