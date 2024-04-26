import { Provider } from '../../Provider.js'
import { ResolutionContext } from '../../ResolutionContext.js'
import { Resolver } from '../../Resolver.js'

export class FunctionProvider implements Provider {
  constructor(private readonly fn: (...args: unknown[]) => unknown) {}

  provide(ctx: ResolutionContext): unknown {
    const deps = new Array(ctx.binding.injections.length)
    for (let i = 0; i < ctx.binding.injections.length; i++) {
      deps[i] = Resolver.resolveParam(ctx.container, this.fn, ctx.binding.injections[i], i, ctx.args)
    }

    return this.fn(...deps)
  }
}
