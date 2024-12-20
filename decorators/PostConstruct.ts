import { typeRegistrar } from '../internal/TypeRegistrar.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils'
import { ErrInvalidBinding } from '../internal/errors'

export function PostConstruct() {
  return function (target: Object, context: ClassMemberDecoratorContext) {
    typeRegistrar.pre(target.constructor, { postConstruct: context.name })

    const metadata = getOrCreateBeanMetadata(context.metadata)

    if (metadata.postConstruct) {
      throw new ErrInvalidBinding(
        `@PostConstruct is already defined on method ${String(context.name)}.\n` +
          'Only 1 @PostConstruct is allowed per class.',
      )
    }

    metadata.postConstruct = context.name
  }
}
