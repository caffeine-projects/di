import { ErrMultiplePrimary } from './internal/errors.js'
import { ErrNoUniqueInjectionForKey } from './internal/errors.js'
import { ErrNoResolutionForKey } from './internal/errors.js'
import { ErrCircularReference } from './internal/errors.js'
import { solutions } from './internal/errors.js'
import { newBinding } from './Binding.js'
import { Binding } from './Binding.js'
import { BindingEntry } from './internal/BindingRegistry.js'
import { DeferredCtor } from './internal/DeferredCtor.js'
import { SimpleKeyedProvider } from './internal/providers/SimpleKeyedProvider'
import { keyStr } from './Key'
import { Key } from './Key'
import { KeyWithOptions } from './Key'
import { fmtKeyError } from './internal/utils/errorFmt.js'
import { fmtParamError } from './internal/utils/errorFmt.js'
import { Ctor } from './internal/types.js'
import { Container } from './Container.js'
import { Optional } from './decorators/Optional.js'
import { Primary } from './decorators/Primary.js'
import { InjectAll } from './decorators/InjectAll.js'

export namespace Resolver {
  export function resolve<T, A = unknown>(container: Container, key: Key<T>, binding?: Binding<T>, args?: A): T {
    if (binding) {
      return binding.scopedProvider.provide({ container, key, binding, args }) as T
    }

    if (key instanceof DeferredCtor) {
      return key.createProxy(target => container.get(target, args))
    }

    let resolved: T | undefined

    if (typeof key === 'function') {
      const criteria = (tk: Key) => typeof tk === 'function' && tk.name !== key.name && key.isPrototypeOf(tk)
      const entries = container.search(criteria)

      if (entries.length === 1) {
        const tk = entries[0].key
        resolved = container.get<T>(tk, args)

        container.configureBinding(key, newBinding({ rawProvider: new SimpleKeyedProvider(tk) }))
      } else if (entries.length > 1) {
        const isPrimary = (x: BindingEntry) => x.binding.primary
        const primaries = entries.filter(isPrimary)

        if (primaries.length > 1) {
          throw new ErrMultiplePrimary(
            `Found multiple 'primary' bindings for the key '${keyStr(key)}'. \n` +
              `Check the following bindings: ${primaries.map(x => keyStr(x.key)).join(', ')}. \n` +
              `Only one component per key can be decorated with @${Primary.name}.`,
          )
        }

        if (primaries.length === 1) {
          const primary = primaries[0]

          resolved = container.get<T>(primary.key, args)

          container.configureBinding(key, newBinding({ ...primary, rawProvider: new SimpleKeyedProvider(primary.key) }))
        } else {
          throw new ErrNoUniqueInjectionForKey(key)
        }
      }
    }

    return resolved as T
  }

  export function construct<T, A = unknown>(container: Container, ctor: Ctor<T>, binding: Binding, args?: A): T {
    const params = new Array(binding.injections.length)
    for (let i = 0; i < binding.injections.length; i++) {
      params[i] = resolveParam(container, ctor, binding.injections[i], i, args)
    }

    return new ctor(...params)
  }

  export function resolveParam<T, A = unknown>(
    container: Container,
    target: Key<T>,
    dep: KeyWithOptions<T>,
    indexOrProp: number | string | symbol,
    args?: A,
  ): T {
    if (dep.key === undefined || dep.key === null) {
      throw new ErrCircularReference(
        `Cannot resolve ${fmtParamError(target, indexOrProp)} from type '${keyStr(
          target,
        )}' because the injection key is undefined.\n` +
          `This could mean that the component '${keyStr(target)}' has a circular reference.` +
          solutions(
            '- If this was intentional, make sure to use "defer()" on your circular dependency.\n' +
              'You can also use "TypeOf<>" on your circular dependency to avoid TS errors during compilation.',
          ),
      )
    }

    const resolution: unknown = !dep.multiple ? container.get(dep.key, args) : container.getMany(dep.key, args)

    if (resolution !== undefined && resolution !== null) {
      return resolution as T
    }

    if (dep.optional) {
      return undefined as unknown as T
    }

    throw new ErrNoResolutionForKey(
      `Unable to resolve ${fmtParamError(target, indexOrProp)} with key ${fmtKeyError(dep)}.` +
        solutions(
          `- Check if the type '${keyStr(target)}' has all its dependencies correctly registered.`,
          `- For multiple injections, make sure to use the decorator '@${InjectAll.name}' or the injection function "injectAll()".`,
          `- If the dependency is optional, decorate it with @${Optional.name} or use the injection function "optional()".`,
        ),
    )
  }
}
