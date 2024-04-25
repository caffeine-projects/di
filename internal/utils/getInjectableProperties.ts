import { Vars } from '../Vars.js'
import { TokenSpec } from '../../Token.js'

export function getInjectableProperties<TFunction extends Object>(target: TFunction): [string, TokenSpec<unknown>][] {
  const injectionTokens: Record<string, TokenSpec<unknown>> = Reflect.getOwnMetadata(
    Vars.CLASS_PROPERTIES_INJECTION_TOKENS,
    target,
  ) || {}

  return Object.entries(injectionTokens)
}
