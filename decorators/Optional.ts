import { configureInjectionMetadata } from './util/configureInjectionMetadata.js'
import { Token } from '../Token.js'

export function Optional(token?: Token<unknown>) {
  return configureInjectionMetadata({ token, optional: true })
}
