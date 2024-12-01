import { Key } from '../Key'
import { configureInjectionMetadata } from './util/decorator_metadata'
import { notNil } from '../internal/utils/notNil.js'

export function InjectAll(key: Key) {
  notNil(key, '@InjectAll key parameter is required.')

  return configureInjectionMetadata({ key, multiple: true })
}
