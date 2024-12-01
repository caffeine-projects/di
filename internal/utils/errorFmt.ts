import { keyStr } from '../../Key'
import { KeyWithOptions } from '../../Key'
import { Key } from '../../Key'
import { isNil } from './isNil.js'

export function fmtParamError(ctor: Key, indexOrProp: number | (string | symbol)): string {
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

export function fmtKeyError(spec: KeyWithOptions): string {
  return `'${keyStr(spec.key)}'`
}
