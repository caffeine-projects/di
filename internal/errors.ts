import { tokenStr } from '../Token.js'
import { Token } from '../Token.js'
import { Named } from '../decorators/Named.js'
import { Inject } from '../decorators/Inject.js'
import { Primary } from '../decorators/Primary.js'
import { ConditionalOn } from '../decorators/ConditionalOn.js'
import { Identifier } from './types.js'

export const solutions = (...solutions: string[]) => '\nPossible Solutions:\n' + solutions.join('\n')

export class DiError extends Error {
  readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.code = code
  }
}

export class ErrNoUniqueInjectionForToken extends DiError {
  constructor(token: Token) {
    super(
      `Found more than one injection for token '${tokenStr(token)}' when a single match was expected. ` +
        solutions(
          `- Use @${Named.name} to differentiate beans and inject the dependency using @${Inject.name}`,
          `- Use @${Primary.name} to specify a unique bean`,
          `- Use @${ConditionalOn.name} to conditionally register beans.`,
        ),
      'NO_UNIQUE_INJECTION',
    )
    this.name = 'NoUniqueInjectionForTokenError'
  }
}

export class ErrNoResolutionForToken extends DiError {
  constructor(message: string) {
    super(message, 'NO_RESOLUTION_FOR_TOKEN')
    this.name = 'NoResolutionForTokenError'
  }
}

export class ErrCircularReference extends DiError {
  constructor(message: string) {
    super(message, 'CIRCULAR_REFERENCE')
    this.name = 'CircularReferenceError'
  }
}

export class ErrScopeNotRegistered extends DiError {
  constructor(scopeId: Identifier) {
    super(
      `Scope ${String(scopeId)} is not registered! use DI.bindScope() static method to register it.`,
      'ERR_SCOPE_NOT_REGISTERED',
    )
    this.name = 'ScopeNotRegisteredError'
  }
}

export class ErrScopeAlreadyRegistered extends DiError {
  constructor(scopeId: Identifier) {
    super(`Scope ${scopeId.toString()} is already registered!`, 'SCOPE_ALREADY_REGISTERED')
    this.name = 'ScopeAlreadyRegisteredError'
  }
}

export class ErrRepeatedInjectableConfiguration extends DiError {
  constructor(message: string) {
    super(message, 'REPEATED_INJECTABLE')
    this.name = 'RepeatedInjectableConfigurationError'
  }
}

export class ErrInvalidBinding extends DiError {
  constructor(message: string) {
    super(message, 'INVALID_BINDING')
    this.name = 'InvalidBindingError'
  }
}

export class ErrInvalidDecorator extends DiError {
  constructor(message: string) {
    super(message, 'ERR_INVALID_DECORATOR')
    this.name = 'ErrInvalidDecorator'
  }
}

export class ErrMultiplePrimary extends DiError {
  constructor(message: string) {
    super(message, 'MULTIPLE_PRIMARY_SAME_COMPONENT')
    this.name = 'MultiplePrimaryError'
  }
}

export class ErrIllegalScopeState extends DiError {
  constructor(message: string) {
    super(message, 'ILLEGAL_SCOPE_STATE')
    this.name = 'IllegalScopeStateError'
  }
}

export class ErrOutOfScope extends DiError {
  constructor(message: string) {
    super(message, 'OUT_OF_SCOPE')
    this.name = 'OutOfScopeError'
  }
}

export class ErrInvalidInjection extends DiError {
  constructor(message: string) {
    super(message, 'INVALID_INJECTION_TOKEN')
    this.name = 'InvalidInjectionToken'
  }
}

export class ErrMissingRequiredProviderArgument extends DiError {
  constructor(message: string) {
    super(message, 'MISS_REQ_PROVIDER_ARG')
    this.name = 'MissingRequiredProviderArgumentError'
  }
}
