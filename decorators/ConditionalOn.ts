import { TypeRegistrar } from '../internal/TypeRegistrar.js'
import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'
import { Container } from '../Container.js'
import { Token } from '../Token.js'
import { Binding } from '../Binding.js'
import { ConfigurationProviderOptions } from './ConfigurationProviderOptions'

export interface ConditionContext {
  container: Container
  token: Token
  binding: Binding
}

export type Conditional = (ctx: ConditionContext) => boolean

export function ConditionalOn<T>(...conditionals: Conditional[]) {
  return function <TFunction extends Function>(target: TFunction | Object, context: DecoratorContext) {
    const merged: Conditional[] = [...conditionals]

    switch (context.kind) {
      case 'class':
        const injectable = TypeRegistrar.get(target as TFunction)

        if (injectable && injectable.conditionals) {
          merged.push(...injectable.conditionals)
        }

        TypeRegistrar.configure<T>(target as TFunction, { conditionals: merged })

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
