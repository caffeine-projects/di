import { Vars } from '../Vars.js'
import { TokenSpec } from '../../Token.js'
import { Identifier } from '../types.js'

export function getInjectableMethods<TFunction extends Function>(
  target: TFunction,
): Array<[Identifier, TokenSpec<unknown>[]]> {
  const setterMethods: string[] = Reflect.getOwnMetadata(Vars.CLASS_SETTER_METHODS, target) || []

  if (setterMethods.length === 0) {
    return []
  }

  const result = new Array<[Identifier, TokenSpec<unknown>[]]>(setterMethods.length)
  for (let i = 0; i < setterMethods.length; i++) {
    const method = setterMethods[i]
    const tokens = Reflect.getOwnMetadata(Vars.CLASS_SETTER_METHODS_TOKENS, target, method)

    result[i] = [method, tokens]
  }

  return result
}
