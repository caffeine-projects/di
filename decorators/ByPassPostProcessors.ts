import { TypeRegistrar } from '../internal/TypeRegistrar.js'
import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'

export function ByPassPostProcessors() {
  return function (target: Function | Object, context: DecoratorContext) {
    if (context.kind === 'class') {
      TypeRegistrar.configure(target as Function, { byPassPostProcessors: true })
      return
    }

    configureBean(getOrCreateBeanMetadata(context.metadata), context.name, {
      byPassPostProcessors: true,
    })
  }
}
