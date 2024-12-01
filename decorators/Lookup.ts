import { Token } from '../Token.js'
import { isValidToken } from '../Token.js'
import { notNil } from '../internal/utils/notNil.js'
import { ErrInvalidBinding } from '../internal/errors.js'
import { ErrInvalidInjection } from '../internal/errors.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils'

export interface LookupOptions {
  multiple?: boolean
  optional?: boolean
}

export function Lookup(token: Token, options?: LookupOptions) {
  return function (target: Object, context: ClassGetterDecoratorContext | ClassMethodDecoratorContext) {
    if (context.kind === 'getter') {
      notNil(
        token,
        `@Lookup() on property key '${String(context.name)}' at class '${
          target.constructor.name
        }' must not be null or undefined.`,
      )
    }

    if (!isValidToken(token)) {
      throw new ErrInvalidInjection(
        `@Lookup() decorator on property '${String(context.name)}' at class '${
          target.constructor.name
        }' doesn't contain a valid injection token. Value is typeof ${typeof token}. ` +
          `It must be a class ref, string or symbol.`,
      )
    }

    const metadata = getOrCreateBeanMetadata(context.metadata)

    for (const [id, _] of metadata.lookupProperties) {
      if (id === context.name) {
        throw new ErrInvalidBinding(
          `@Lookup() already added on property '${String(context.name)}' at class '${target.constructor.name}'.`,
        )
      }
    }

    metadata.lookupProperties.set(context.name, { ...options, token: token })
  }
}
