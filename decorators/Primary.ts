import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'

export function Primary() {
  return function (target: Function | object, context: DecoratorContext) {
    if (context.kind === 'class') {
      TypeRegistrar.configure(target as Function, { primary: true })
      return
    }

    configureBean(getOrCreateBeanMetadata(context.metadata), context.name, {
      primary: true,
    })
  }
}
