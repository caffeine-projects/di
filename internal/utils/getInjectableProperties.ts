import { Vars } from '../Vars.js'
import { TokenSpec } from '../../Token.js'
import { Identifier } from '../types.js'

export function getInjectableProperties<TFunction extends Object>(
  target: TFunction,
): Map<Identifier, TokenSpec<unknown>> {
  const injectionTokens: Record<string, TokenSpec<unknown>> = Reflect.getOwnMetadata(
    Vars.CLASS_PROPERTIES_INJECTION_TOKENS,
    target,
  ) || {}

  return new Map(Object.entries(injectionTokens))
}
