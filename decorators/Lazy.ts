import { configureBean } from '../internal/utils/beanUtils.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'

export function Lazy<T>(lazy = true) {
  return function <TFunction extends Function>(target: TFunction | object, ctx: DecoratorContext) {
    if (ctx.kind === 'class') {
      TypeRegistrar.configure<T>(target as TFunction, { lazy })
      return
    }

    configureBean(target.constructor, ctx.name, {
      lazy,
    })
  }
}
