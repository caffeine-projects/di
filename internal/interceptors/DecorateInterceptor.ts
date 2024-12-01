import { ResolutionContext } from '../../ResolutionContext.js'
import { PostResolutionInterceptor } from '../../PostResolutionInterceptor.js'
import { Resolver } from '../../Resolver.js'
import { Ctor } from '../types.js'
import { Key } from '../../Key'
import { keyStr } from '../../Key'
import { isNamedKey } from '../../Key'
import { ErrNoUniqueInjectionForKey } from '../errors.js'
import { ErrNoResolutionForKey } from '../errors.js'
import { solutions } from '../errors.js'
import { ErrInvalidBinding } from '../errors.js'
import { Injectable } from '../../decorators/Injectable.js'
import { Bean } from '../../decorators/Bean.js'

export class DecorateInterceptor<T> implements PostResolutionInterceptor<T> {
  constructor(private readonly decorator: Key) {}

  intercept(instance: T, ctx: ResolutionContext): T {
    const binding = DecorateInterceptor.uniqueBinding(ctx, this.decorator)
    const decoratees = binding.injections.filter(x => x.decorated)

    if (decoratees.length === 0) {
      throw new ErrInvalidBinding(
        `Decorator '${keyStr(this.decorator)}' for '${keyStr(
          ctx.key,
        )}' must have 1 constructor parameter decorated with '@Decoratee()'`,
      )
    }

    if (decoratees.length > 1) {
      throw new ErrInvalidBinding(
        `Decorator '${keyStr(this.decorator)}' for '${keyStr(ctx.key)}' contains '${
          decoratees.length
        }' parameters decorated with '@Decoratee()'. It must have only 1 constructor parameter as the decoratee. ` +
          solutions(
            `- Check the decorator class '${keyStr(
              this.decorator,
            )}' constructor and ensure it contains only 1 '@Decoratee()' parameter`,
          ),
      )
    }

    const args = new Array(binding.injections.length)

    for (let i = 0; i < binding.injections.length; i++) {
      const injection = binding.injections[i]

      if (injection.decorated) {
        args[i] = instance
      } else {
        args[i] = Resolver.resolveParam(ctx.container, ctx.key, injection, i, ctx.args)
      }
    }

    if (isNamedKey(this.decorator)) {
      if (typeof binding.type === 'function') {
        return new (binding.type as Ctor)(...args)
      } else {
        throw new ErrNoResolutionForKey(
          `Unable to resolve decorator '${keyStr(this.decorator)}' for class '${keyStr(
            ctx.key,
          )}'. Reason: Couldn't find a valid decorator class to construct. Decorator Key is named and the binding type is: '${
            binding.type
          }' of type '${typeof binding.type}'` +
            solutions(
              `- Check if the named injection Key '${keyStr(
                this.decorator,
              )}' is pointing to a valid decorator class and the decorator has the same structure of '${keyStr(
                ctx.key,
              )}'`,
            ),
        )
      }
    } else {
      return new (this.decorator as Ctor)(...args)
    }
  }

  private static uniqueBinding(ctx: ResolutionContext, Key: Key) {
    const bindings = ctx.container.getBindings(Key)

    if (bindings.length === 0) {
      throw new ErrNoResolutionForKey(
        `Unable to resolve decorator '${keyStr(Key)}' for class '${keyStr(ctx.key)}'. Reason: Found 0 registrations. ` +
          solutions(
            `- Check if the decorator '${keyStr(Key)}' is correctly decorated with '@${Injectable.name}' or '@${
              Bean.name
            }'`,
            `- Check if the decorator is correctly imported in any place before resolution`,
          ),
      )
    }

    if (bindings.length > 1) {
      const primary = bindings.find(x => x.primary)

      if (primary) {
        return primary
      } else {
        throw new ErrNoUniqueInjectionForKey(Key)
      }
    } else {
      return bindings[0]
    }
  }
}
