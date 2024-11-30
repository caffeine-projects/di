import { MultiplePrimaryError } from './internal/errors.js'
import { NoUniqueInjectionForTokenError } from './internal/errors.js'
import { NoResolutionForTokenError } from './internal/errors.js'
import { CircularReferenceError } from './internal/errors.js'
import { solutions } from './internal/errors.js'
import { newBinding } from './Binding.js'
import { Binding } from './Binding.js'
import { DeferredCtor } from './internal/DeferredCtor.js'
import { TokenProvider } from './internal/providers/TokenProvider.js'
import { tokenStr } from './Token.js'
import { Token } from './Token.js'
import { TokenDescriptor } from './Token.js'
import { fmtTokenError } from './internal/utils/errorFmt.js'
import { fmtParamError } from './internal/utils/errorFmt.js'
import { Ctor } from './internal/types.js'
import { Container } from './Container.js'
import { Optional } from './decorators/Optional.js'
import { Primary } from './decorators/Primary.js'
import { InjectAll } from './decorators/InjectAll.js'
import { AsyncProvider } from './internal/providers/AsyncProvider.js'

async function resolveAsync<T, A = unknown>(
  container: Container,
  token: Token<T>,
  binding?: Binding<T>,
  args?: A,
): Promise<T> {
  if (binding) {
    if (binding.rawProvider instanceof AsyncProvider) {
      return binding.scopedProvider.provide({ container, token, binding, args })
    } else {
      return Promise.resolve(binding.scopedProvider.provide({ container, token, binding, args }))
    }
  }

  if (token instanceof DeferredCtor) {
    return token.createProxy(target => container.get(target, args))
  }

  let resolved: T | undefined

  if (typeof token === 'function') {
    const entries = container.search(
      tk => typeof tk === 'function' && tk.name !== token.name && token.isPrototypeOf(tk),
    )

    if (entries.length === 1) {
      const tk = entries[0].token
      resolved = await container.getAsync<T>(tk, args)

      container.configureBinding(token, newBinding({ rawProvider: new TokenProvider(tk) }))
    } else if (entries.length > 1) {
      const primaries = entries.filter(x => x.binding.primary)

      if (primaries.length > 1) {
        throw new MultiplePrimaryError(
          `Found multiple 'primary' bindings for token '${tokenStr(token)}'. \n` +
            `Check the following bindings: ${primaries.map(x => tokenStr(x.token)).join(', ')}. \n` +
            `Only one component per token can be decorated with @${Primary.name}`,
        )
      }

      if (primaries.length === 1) {
        const primary = primaries[0]

        resolved = await container.getAsync<T>(primary.token, args)

        container.configureBinding(token, newBinding({ ...primary, rawProvider: new TokenProvider(primary.token) }))
      } else {
        throw new NoUniqueInjectionForTokenError(token)
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
  target: Token<T>,
  dep: TokenDescriptor<T>,
  indexOrProp: number | string | symbol,
  args?: A,
): Promise<T> {
  if (dep.token === undefined || dep.token === null) {
    throw new CircularReferenceError(
      `Cannot resolve ${fmtParamError(target, indexOrProp)} from type '${tokenStr(
        target,
      )}' because the injection token is undefined.\n` +
        `This could mean that the component '${tokenStr(target)}' has a circular reference.` +
        solutions(
          `- If this was intentional, make sure to decorate your circular dependency with @Defer and use the type 'TypeOf<>' to avoid TS errors during compilation.`,
        ),
    )
  }

  let resolution: unknown

  if (dep.multiple) {
    resolution = container.getMany(dep.token, args)
  } else {
    resolution = await container.getAsync(dep.token, args)
  }

  if (resolution !== undefined && resolution !== null) {
    return resolution as T
  }

  if (dep.optional) {
    return undefined as unknown as T
  }

  throw new NoResolutionForTokenError(
    `Unable to resolve ${fmtParamError(target, indexOrProp)} with token ${fmtTokenError(dep)}.` +
      solutions(
        `- Check if the type '${tokenStr(target)}' has all its dependencies correctly registered`,
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
