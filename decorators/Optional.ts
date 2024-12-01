import { configureInjectionMetadata } from './util/decorator_metadata'
import { Token } from '../Token.js'

export function Optional(token?: Token<unknown>) {
  return configureInjectionMetadata({ token, optional: true })
}
