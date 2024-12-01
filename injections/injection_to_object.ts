import { ObjectInjections } from '../Key'
import { Key } from '../Key'
import { check } from '../internal/utils/check'

export interface ObjectDestructuringOptions {
  key: string | symbol
  multiple?: boolean
  optional?: boolean
}

export function property(
  key: Key,
  keyOrOptions: string | symbol | ObjectDestructuringOptions,
  options?: Omit<ObjectDestructuringOptions, 'key'>,
): ObjectInjections {
  if (typeof keyOrOptions === 'object') {
    check(!!keyOrOptions.key, 'Key argument is required when using decorator @Bag()')

    return { key: key, property: keyOrOptions.key, optional: keyOrOptions.optional, multiple: keyOrOptions.multiple }
  } else {
    check(!!keyOrOptions, 'Key argument is required when using decorator @Bag()')

    return {
      key: key,
      property: keyOrOptions,
      multiple: options?.multiple,
      optional: options?.optional,
    }
  }
}

export function propertyList(key: Key, property: string | symbol): ObjectInjections {
  check(!!property, 'Key argument is required when using decorator @Bag()')

  return {
    key: key,
    property: property,
    multiple: true,
  }
}
