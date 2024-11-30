import { tokenStr } from '../../Token.js'
import { TokenDescriptor } from '../../Token.js'
import { Token } from '../../Token.js'
import { isNil } from './isNil.js'

export function fmtParamError(ctor: Token, indexOrProp: number | (string | symbol)): string {
  const isNum = typeof indexOrProp === 'number'
  const msg = isNum ? `parameter at position '${indexOrProp}'` : `property '${String(indexOrProp)}'`

  if (typeof ctor !== 'function') {
    return msg
  }

  const [, params = null] = ctor.toString().match(/constructor\(([\w, ]+)\)/) || []

  if (params === null) {
    return msg
  }

  if (isNum) {
    return `parameter '${params.split(',')[indexOrProp].trim()}' at position '${indexOrProp}'`
  }

  return msg
}

export function fmtTokenError(spec: TokenDescriptor): string {
  return `'${tokenStr(spec.token)}'`
}
