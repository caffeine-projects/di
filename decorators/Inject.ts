import { ErrInvalidBinding } from '../internal/errors.js'
import { check } from '../internal/utils/check.js'
import { Injection, Key, KeyWithOptions } from '../Key'
import { configureInjectionMetadata } from './util/decorator_metadata'

export function Inject(key: Key): (target: Function | object | undefined, context: ClassMemberDecoratorContext) => void

export function Inject(
  dependencies: Injection[],
): (target: Function | object | undefined, context: ClassMemberDecoratorContext) => void

export function Inject(
  keyOrDependencies: Key | Injection[],
): (target: Function | object | undefined, context: ClassMemberDecoratorContext) => void {
  return function (target: Function | object | undefined, context: ClassMemberDecoratorContext) {
    switch (context.kind) {
      case 'method':
        check(
          Array.isArray(keyOrDependencies),
          new ErrInvalidBinding(
            'When using the @Inject decorator on a method, parameter dependencies must be an array.\n' +
              `Received: ${typeof keyOrDependencies}\n` +
              `Check method ${String(context.name)}.`,
          ),
        )

        const deps: Array<KeyWithOptions> = (keyOrDependencies as Array<Injection>).map(dep =>
          typeof dep === 'object' ? (dep as KeyWithOptions) : ({ key: dep } as KeyWithOptions),
        )

        configureInjectionMetadata({}, deps)(target, context)

        break

      case 'accessor':
      case 'field':
      case 'getter':
      case 'setter':
        configureInjectionMetadata({ key: keyOrDependencies as Key })(target, context)

        break
    }
  }
}
