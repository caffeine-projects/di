import { Binding } from '../Binding.js'
import { check } from '../internal/utils/check.js'
import { notNil } from '../internal/utils/notNil.js'
import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'
import { Injection } from '../Token.js'

export function Bind<T>(
  options: Partial<Exclude<Binding<T>, 'id' | 'scopedProvider' | 'configuration' | 'cachedInstance'>>,
  dependencies: Injection[] = [],
) {
  notNil(options)
  check(typeof options === 'object', '@Bind parameter must be an object')
  check(options.id === undefined, 'Setting the binding id is forbidden')
  check(options.scopedProvider === undefined, 'Setting the scopedProvider here is forbidden')

  return function <TFunction extends Function>(target: TFunction | object, context: DecoratorContext) {
    if (context.kind === 'class') {
      const metadata = getOrCreateBeanMetadata(context.metadata)
      const injections = dependencies?.map(dep => (typeof dep === 'object' ? dep : { token: dep })) ?? []

      TypeRegistrar.configure<T>(
        target as TFunction,
        {
          injections: injections,
          injectableProperties: metadata.injectableProperties,
          injectableMethods: metadata.injectableMethods,
          lookupProperties: metadata.lookupProperties,
          type: target,

          ...options,

          configuration: false,
          postConstruct: metadata.postConstruct,
          preDestroy: metadata.preDestroy,
        } as Partial<Binding<T>>,
      )

      return
    }

    configureBean(getOrCreateBeanMetadata(context.metadata), context.name, {
      ...options,
      configuration: false,
    } as Partial<Binding<T>>)
  }
}
