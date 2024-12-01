import { configureInjectionMetadata } from './util/decorator_metadata'
import { Key } from '../Key'

export function Optional(key?: Key<unknown>) {
  return configureInjectionMetadata({ key, optional: true })
}
