import { TokenDescriptor } from '../../Token.js'
import { Injection } from '../../Token.js'
import { getOrCreateBeanMetadata } from '../../internal/utils/beanUtils'

export function configureInjectionMetadata(
  tokenSpec: Partial<TokenDescriptor<unknown>>,
  dependencies: Injection[] = [],
): (target: Function | object | undefined, context: ClassMemberDecoratorContext) => void {
  return function (_target: Function | object | undefined, context: ClassMemberDecoratorContext): void {
    const metadata = getOrCreateBeanMetadata(context.metadata)
    const injections = dependencies.map(dep => (typeof dep === 'object' ? (dep as TokenDescriptor) : { token: dep }))

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
        metadata.injectableProperties.set(context.name, tokenSpec)
        break
    }
  }
}

export function createClazzInjectable() {}
