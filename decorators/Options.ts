import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'

export function Options<O extends object, T = unknown>(options: O) {
  return function <TFunction extends Function>(target: TFunction | object, context: DecoratorContext) {
    if (context.kind === 'class') {
      const injectable = TypeRegistrar.get(target as TFunction)

      if (injectable && injectable.options) {
        options = { ...injectable.options, ...options }
      }

      TypeRegistrar.configure<T>(target as TFunction, { options })
      return
    }

    const metadata = getOrCreateBeanMetadata(context.metadata)
    const config = metadata.methods.get(context.name)

    if (config && config.options) {
      options = { ...config.options, ...options }
    }

    configureBean(metadata, context.name, {
      options,
    })
  }
}
