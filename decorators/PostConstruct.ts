import { TypeRegistrar } from '../internal/TypeRegistrar.js'

export function PostConstruct(): MethodDecorator {
  return function (target, propertyKey) {
    TypeRegistrar.pre(target.constructor, { postConstruct: propertyKey })
  }
}
