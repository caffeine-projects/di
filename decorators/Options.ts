import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'
import { typeRegistrar } from '../internal/TypeRegistrar.js'

export function Options<O extends object, T = unknown>(options: O) {
  return function <TFunction extends Function>(target: TFunction | object, context: DecoratorContext) {
    if (context.kind === 'class') {
      const injectable = typeRegistrar.get(target as TFunction)

      if (injectable && injectable.options) {
        options = { ...injectable.options, ...options }
      }

      typeRegistrar.configure<T>(target as TFunction, { options })
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
