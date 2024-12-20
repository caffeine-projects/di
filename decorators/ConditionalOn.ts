import { typeRegistrar } from '../internal/TypeRegistrar.js'
import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'
import { Container } from '../Container.js'
import { Key } from '../Key'
import { Binding } from '../Binding.js'

import { ConfigurationProviderOptions } from '../internal/utils/beanUtils.js'

export interface ConditionContext {
  container: Container
  key: Key
  binding: Binding
}

export type Conditional = (ctx: ConditionContext) => boolean

export function ConditionalOn<T>(...conditionals: Conditional[]) {
  return function <TFunction extends Function>(target: TFunction | Object, context: DecoratorContext) {
    const merged: Conditional[] = [...conditionals]

    switch (context.kind) {
      case 'class':
        const injectable = typeRegistrar.get(target as TFunction)

        if (injectable && injectable.conditionals) {
          merged.push(...injectable.conditionals)
        }

        typeRegistrar.configure<T>(target as TFunction, { conditionals: merged })

        break

      default:
        const metadata = getOrCreateBeanMetadata(context.metadata)
        const config = metadata.methods.get(context.name) || ({} as ConfigurationProviderOptions)

        if (config.conditionals) {
          merged.push(...config.conditionals)
        }

        configureBean(metadata, context.name, {
          conditionals: merged,
        })
    }
  }
}
