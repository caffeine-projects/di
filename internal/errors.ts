import { keyStr } from '../Key'
import { Key } from '../Key'
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

export class ErrNoUniqueInjectionForKey extends DiError {
  constructor(key: Key) {
    super(
      `Found more than one injection for the key '${keyStr(key)}' when a single match was expected. ` +
        solutions(
          `- Use @${Named.name} to differentiate beans and inject the dependency using @${Inject.name}`,
          `- Use @${Primary.name} to specify a unique bean`,
          `- Use @${ConditionalOn.name} to conditionally register beans.`,
        ),
      'ERR_NO_UNIQUE_INJECTION',
    )
    this.name = 'ErrNoUniqueInjectionForKey'
  }
}

export class ErrNoResolutionForKey extends DiError {
  constructor(message: string) {
    super(message, 'ERR_NO_RESOLUTION_FOR_KEY')
    this.name = 'ErrNoResolutionForKey'
  }
}

export class ErrCircularReference extends DiError {
  constructor(message: string) {
    super(message, 'ERR_CIRCULAR_REFERENCE')
    this.name = 'ErrCircularReference'
  }
}

export class ErrScopeNotRegistered extends DiError {
  constructor(scopeId: Identifier) {
    super(
      `Scope ${String(scopeId)} is not registered! use DI.bindScope() static method to register it.`,
      'ERR_SCOPE_NOT_REGISTERED',
    )
    this.name = 'ErrScopeNotRegistered'
  }
}

export class ErrScopeAlreadyRegistered extends DiError {
  constructor(scopeId: Identifier) {
    super(`Scope ${scopeId.toString()} is already registered!`, 'ERR_SCOPE_ALREADY_REGISTERED')
    this.name = 'ErrScopeAlreadyRegistered'
  }
}

export class ErrRepeatedInjectableConfiguration extends DiError {
  constructor(message: string) {
    super(message, 'ERR_REPEATED_INJECTABLE')
    this.name = 'ErrRepeatedInjectableConfiguration'
  }
}

export class ErrInvalidBinding extends DiError {
  constructor(message: string) {
    super(message, 'ERR_INVALID_BINDING')
    this.name = 'ErrInvalidBinding'
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
    super(message, 'ERR_MULTIPLE_PRIMARY_SAME_COMPONENT')
    this.name = 'ErrMultiplePrimary'
  }
}

export class ErrIllegalScopeState extends DiError {
  constructor(message: string) {
    super(message, 'ERR_ILLEGAL_SCOPE_STATE')
    this.name = 'ErrIllegalScopeState'
  }
}

export class ErrOutOfScope extends DiError {
  constructor(message: string) {
    super(message, 'ERR_OUT_OF_SCOPE')
    this.name = 'ErrOutOfScope'
  }
}

export class ErrInvalidInjection extends DiError {
  constructor(message: string) {
    super(message, 'ERR_INVALID_INJECTION_KEY')
    this.name = 'ErrInvalidInjectionKey'
  }
}

export class ErrMissingRequiredProviderArgument extends DiError {
  constructor(message: string) {
    super(message, 'ERR_MISS_REQ_PROVIDER_ARG')
    this.name = 'ErrMissingRequiredProviderArgument'
  }
}
