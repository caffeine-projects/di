import { KeyWithOptions } from '../../Key'
import { Injection } from '../../Key'
import { getOrCreateBeanMetadata } from '../../internal/utils/beanUtils'

export function configureInjectionMetadata(
  keyWithOpts: Partial<KeyWithOptions<unknown>>,
  dependencies: Injection[] = [],
): (target: Function | object | undefined, context: ClassMemberDecoratorContext) => void {
  return function (_target: Function | object | undefined, context: ClassMemberDecoratorContext): void {
    const metadata = getOrCreateBeanMetadata(context.metadata)
    const injections = dependencies.map(dep => (typeof dep === 'object' ? (dep as KeyWithOptions) : { key: dep }))

    switch (context.kind) {
      case 'method':
        const existingMethodInjections = metadata.injectableMethods.get(context.name) ?? []
        existingMethodInjections.push(...injections)
        metadata.injectableMethods.set(context.name, existingMethodInjections)
        break

      case 'field':
      case 'accessor':
      case 'getter':
      case 'setter':
        metadata.injectableProperties.set(context.name, keyWithOpts)
        break
    }
  }
}

export function createClazzInjectable() {}
