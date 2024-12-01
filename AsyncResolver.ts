import { ErrMultiplePrimary } from './internal/errors.js'
import { ErrNoUniqueInjectionForKey } from './internal/errors.js'
import { ErrNoResolutionForKey } from './internal/errors.js'
import { ErrCircularReference } from './internal/errors.js'
import { solutions } from './internal/errors.js'
import { newBinding } from './Binding.js'
import { Binding } from './Binding.js'
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
import { AsyncProvider } from './internal/providers/AsyncProvider.js'

async function resolveAsync<T, A = unknown>(
  container: Container,
  key: Key<T>,
  binding?: Binding<T>,
  args?: A,
): Promise<T> {
  if (binding) {
    if (binding.rawProvider instanceof AsyncProvider) {
      return binding.scopedProvider.provide({ container, key, binding, args })
    } else {
      return Promise.resolve(binding.scopedProvider.provide({ container, key, binding, args }))
    }
  }

  if (key instanceof DeferredCtor) {
    return key.createProxy(target => container.get(target, args))
  }

  let resolved: T | undefined

  if (typeof key === 'function') {
    const entries = container.search(tk => typeof tk === 'function' && tk.name !== key.name && key.isPrototypeOf(tk))

    if (entries.length === 1) {
      const tk = entries[0].key
      resolved = await container.getAsync<T>(tk, args)

      container.configureBinding(key, newBinding({ rawProvider: new SimpleKeyedProvider(tk) }))
    } else if (entries.length > 1) {
      const primaries = entries.filter(x => x.binding.primary)

      if (primaries.length > 1) {
        throw new ErrMultiplePrimary(
          `Found multiple 'primary' bindings for key '${keyStr(key)}'. \n` +
            `Check the following bindings: ${primaries.map(x => keyStr(x.key)).join(', ')}. \n` +
            `Only one component per key can be decorated with @${Primary.name}`,
        )
      }

      if (primaries.length === 1) {
        const primary = primaries[0]

        resolved = await container.getAsync<T>(primary.key, args)

        container.configureBinding(key, newBinding({ ...primary, rawProvider: new SimpleKeyedProvider(primary.key) }))
      } else {
        throw new ErrNoUniqueInjectionForKey(key)
      }
    }
  }

  return resolved as T
}

async function constructAsync<T, A = unknown>(
  container: Container,
  ctor: Ctor<T>,
  binding: Binding,
  args?: A,
): Promise<T> {
  const params = await Promise.all(
    binding.injections.map((dep, index) => resolveParamAsync(container, ctor, dep, index, args)),
  )

  return new ctor(...params)
}

async function resolveParamAsync<T, A = unknown>(
  container: Container,
  target: Key<T>,
  dep: KeyWithOptions<T>,
  indexOrProp: number | string | symbol,
  args?: A,
): Promise<T> {
  if (dep.key === undefined || dep.key === null) {
    throw new ErrCircularReference(
      `Cannot resolve ${fmtParamError(target, indexOrProp)} from type '${keyStr(
        target,
      )}' because the injection key is undefined.\n` +
        `This could mean that the component '${keyStr(target)}' has a circular reference.` +
        solutions(
          `- If this was intentional, make sure to decorate your circular dependency with @Defer and use the type 'TypeOf<>' to avoid TS errors during compilation.`,
        ),
    )
  }

  let resolution: unknown

  if (dep.multiple) {
    resolution = container.getMany(dep.key, args)
  } else {
    resolution = await container.getAsync(dep.key, args)
  }

  if (resolution !== undefined && resolution !== null) {
    return resolution as T
  }

  if (dep.optional) {
    return undefined as unknown as T
  }

  throw new ErrNoResolutionForKey(
    `Unable to resolve ${fmtParamError(target, indexOrProp)} with key ${fmtKeyError(dep)}.` +
      solutions(
        `- Check if the type '${keyStr(target)}' has all its dependencies correctly registered`,
        `- For multiple injections, make sure to use the decorator '@${InjectAll.name}' passing the type of the array`,
        `- If the dependency is optional, decorate it with @${Optional.name}`,
      ),
  )
}

export const AsyncResolver = {
  resolveAsync,
  resolveParamAsync,
  constructAsync,
}
