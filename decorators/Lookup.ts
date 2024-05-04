import { Token } from '../Token.js'
import { isValidToken } from '../Token.js'
import { notNil } from '../internal/utils/notNil.js'
import { InvalidBindingError } from '../internal/errors.js'
import { InvalidInjectionToken } from '../internal/errors.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'

export interface LookupOptions {
  multiple?: boolean
  optional?: boolean
}

export function Lookup(token?: Token, options?: LookupOptions): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    if (typeof descriptor.get !== 'function') {
      notNil(
        token,
        `@Lookup() on property key '${String(propertyKey)}' at class '${
          target.constructor.name
        }' must not be null or undefined.`,
      )
    }

    const type = Reflect.getMetadata('design:type', target, propertyKey)
    const injectionToken: Token = token ? token : type

    if (!isValidToken(injectionToken)) {
      throw new InvalidInjectionToken(
        `@Lookup() decorator on property '${String(propertyKey)}' at class '${
          target.constructor.name
        }' doesn't contain a valid injection token. Value is typeof ${typeof injectionToken}. ` +
          `It must be a class ref, string or symbol.`,
      )
    }

    const binding = TypeRegistrar.configure(target.constructor, { pre: false })

    for (const [id, _] of binding.lookupProperties) {
      if (id === propertyKey) {
        throw new InvalidBindingError(
          `@Lookup() already added on property '${String(propertyKey)}' at class '${target.constructor.name}'.`,
        )
      }
    }

    binding.lookupProperties.push([propertyKey, { ...options, token: injectionToken, tokenType: type }])
  }
}
