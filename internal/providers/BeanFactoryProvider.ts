import { Resolver } from '../../Resolver.js'
import { Provider } from '../../Provider.js'
import { ResolutionContext } from '../../ResolutionContext.js'
import { Ctor } from '../types.js'
import { ConfigurationProviderOptions } from '../utils/beanUtils'

export class BeanFactoryProvider<T> implements Provider<T> {
  constructor(
    private readonly target: Ctor,
    private readonly method: string | symbol,
    private readonly options: ConfigurationProviderOptions,
  ) {}

  provide(ctx: ResolutionContext): T {
    const clazz = ctx.container.get<{ [key: symbol | string]: (...args: unknown[]) => T }>(this.target, ctx.args)
    const deps = new Array(this.options.dependencies.length)
    for (let i = 0; i < this.options.dependencies.length; i++) {
      deps[i] = Resolver.resolveParam(ctx.container, this.options.key, this.options.dependencies[i], i, ctx.args)
    }

    return clazz[this.method](...deps)
  }
}
