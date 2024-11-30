import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'

export function Lazy<T>(lazy = true) {
  return function <TFunction extends Function>(target: TFunction | object, context: DecoratorContext) {
    if (context.kind === 'class') {
      TypeRegistrar.configure<T>(target as TFunction, { lazy })
      return
    }

    configureBean(getOrCreateBeanMetadata(context.metadata), context.name, {
      lazy,
    })
  }
}
