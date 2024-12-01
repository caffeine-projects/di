import { keyStr } from '../../Key'
import { Container } from '../../Container.js'

export function containerToString(container: Container): string {
  return (
    `${container.constructor.name}(namespace=${String(container.namespace)}, count=${container.size}) {` +
    '\n' +
    Array.from(container.entries())
      .map(
        ([key, binding]) =>
          `${keyStr(key)}: ` +
          `names=[${binding.names?.map(x => keyStr(x)).join(', ')}], ` +
          `scope=${binding.scopeId.toString()}, ` +
          `injections=[${binding.injections
            ?.map(
              spec =>
                '[' + keyStr(spec.key) + `: optional=${spec.optional || false}, multiple=${spec.multiple || false}]`,
            )
            .join(', ')}], ` +
          `lazy=${binding.lazy}, ` +
          `provider=${binding.rawProvider?.constructor?.name}`,
      )
      .join('\n, ') +
    '\n}'
  )
}
