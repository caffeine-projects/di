import { PostResolutionInterceptor } from '../PostResolutionInterceptor.js'
import { ResolutionContext } from '../ResolutionContext.js'
import { TypeRegistrar } from '../internal/TypeRegistrar.js'
import { configureBean } from '../internal/utils/beanUtils.js'
import { getOrCreateBeanMetadata } from '../internal/utils/beanUtils.js'
import { notNil } from '../internal/utils/notNil.js'
import { FunctionPostResolutionInterceptor } from '../internal/interceptors/FunctionPostResolutionInterceptor.js'

export function Interceptor<T>(
  interceptor: PostResolutionInterceptor<T> | ((instance: T, resolutionContext: ResolutionContext) => T),
) {
  return function <TFunction extends Function>(target: TFunction | object, context: DecoratorContext) {
    const parsed = notNil(
      typeof interceptor === 'function' ? new FunctionPostResolutionInterceptor(interceptor) : interceptor,
    )

    if (context.kind === 'class') {
      TypeRegistrar.configure<T>(target as TFunction, { interceptors: [parsed] })
      return
    }

    configureBean(getOrCreateBeanMetadata(context.metadata), context.name, {
      interceptors: [parsed],
    })
  }
}
