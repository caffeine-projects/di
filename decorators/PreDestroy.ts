import { TypeRegistrar } from '../internal/TypeRegistrar.js'

export function PreDestroy(): MethodDecorator {
  return function (target, propertyKey) {
    TypeRegistrar.pre(target.constructor, { preDestroy: propertyKey })
  }
}
