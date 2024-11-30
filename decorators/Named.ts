import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'
import { Identifier } from '../internal/types.js'

export function Named<T>(name: Identifier) {
  return function <TFunction extends Function>(target: TFunction | object, context: DecoratorContext) {
    switch (context.kind) {
      case 'class':
        TypeRegistrar.configure<T>(target as TFunction, { names: [name] })
        break

      case 'method':
        configureBean(getOrCreateBeanMetadata(context.metadata), context.name, { names: [name] })
        break
    }
  }
}
