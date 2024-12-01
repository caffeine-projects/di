import { ErrInvalidBinding } from '../internal/errors.js'
import { check } from '../internal/utils/check.js'
import { Injection, Token, TokenDescriptor } from '../Token.js'
import { configureInjectionMetadata } from './util/decorator_metadata'

export function Inject(
  token: Token,
): (target: Function | object | undefined, context: ClassMemberDecoratorContext) => void
export function Inject(
  dependencies: Injection[],
): (target: Function | object | undefined, context: ClassMemberDecoratorContext) => void
export function Inject(
  tokenOrDependencies: Token | Injection[],
): (target: Function | object | undefined, context: ClassMemberDecoratorContext) => void {
  return function (target: Function | object | undefined, context: ClassMemberDecoratorContext) {
    switch (context.kind) {
      case 'method':
        check(
          Array.isArray(tokenOrDependencies),
          new ErrInvalidBinding('when @Inject on method, dependencies must be an array'),
        )

        const deps: Array<TokenDescriptor<unknown>> = (tokenOrDependencies as Array<Injection>).map(dep =>
          typeof dep === 'object' ? (dep as TokenDescriptor) : { token: dep },
        )

        configureInjectionMetadata({}, deps)(target, context)

        break

      case 'accessor':
      case 'field':
      case 'getter':
      case 'setter':
        configureInjectionMetadata({ token: tokenOrDependencies as Token })(target, context)

        break
    }
  }
}
