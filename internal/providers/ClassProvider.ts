import { Resolver } from '../../Resolver.js'
import { Provider } from '../../Provider.js'
import { ResolutionContext } from '../../ResolutionContext.js'
import { Ctor } from '../types.js'

export class ClassProvider<T = any> implements Provider<T> {
  constructor(private readonly clazz: Ctor<T>) {}

  provide(ctx: ResolutionContext): T {
    if (ctx.binding.injections.length === 0) {
      return new this.clazz()
    }

    const params = new Array(ctx.binding.injections.length)
    for (let i = 0; i < ctx.binding.injections.length; i++) {
      params[i] = Resolver.resolveParam(ctx.container, this.clazz, ctx.binding.injections[i], i, ctx.args)
    }

    return new this.clazz(...params)
  }
}
