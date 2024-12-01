import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils'
import { ErrInvalidBinding } from '../internal/errors'

export function PreDestroy() {
  return function (_target: Function, context: ClassMethodDecoratorContext) {
    const metadata = getOrCreateBeanMetadata(context.metadata)

    if (metadata.preDestroy) {
      throw new ErrInvalidBinding('PreDestroy already defined')
    }

    metadata.preDestroy = context.name
  }
}
