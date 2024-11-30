import { TypeRegistrar } from '../internal/TypeRegistrar.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils'
import { InvalidBindingError } from '../internal/errors'

export function PostConstruct() {
  return function (target: Object, context: ClassMemberDecoratorContext) {
    TypeRegistrar.pre(target.constructor, { postConstruct: context.name })

    const metadata = getOrCreateBeanMetadata(context.metadata)

    if (metadata.postConstruct) {
      throw new InvalidBindingError('PostConstruct already defined')
    }

    metadata.postConstruct = context.name
  }
}
