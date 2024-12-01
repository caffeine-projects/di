import { Key } from '../Key'
import { configureBean } from '../internal/utils/beanUtils.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'
import { Identifier } from '../internal/types.js'
import { Lifecycle } from '../Lifecycle.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'

export function Scoped(scopeId: Identifier) {
  return function (target: Function | object, context: DecoratorContext) {
    if (context.kind === 'class') {
      TypeRegistrar.configure(target as Key, { scopeId })
      return
    }

    configureBean(getOrCreateBeanMetadata(context.metadata), context.name, {
      scopeId,
    })
  }
}

Scoped.SINGLETON = Lifecycle.SINGLETON
Scoped.TRANSIENT = Lifecycle.TRANSIENT
Scoped.CONTAINER = Lifecycle.CONTAINER
Scoped.LOCAL_RESOLUTION = Lifecycle.LOCAL_RESOLUTION
Scoped.REQUEST = Lifecycle.REQUEST
Scoped.REFRESH = Lifecycle.REFRESH
