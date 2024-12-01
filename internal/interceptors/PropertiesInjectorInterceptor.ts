import { Resolver } from '../../Resolver.js'
import { PostResolutionInterceptor } from '../../PostResolutionInterceptor.js'
import { ResolutionContext } from '../../ResolutionContext.js'

export class PropertiesInjectorInterceptor<T> implements PostResolutionInterceptor<T> {
  intercept(instance: any, ctx: ResolutionContext): T {
    for (const [prop, key] of ctx.binding.injectableProperties) {
      instance[prop] = Resolver.resolveParam(ctx.container, ctx.key, key, prop, ctx.args)
    }

    return instance
  }
}
