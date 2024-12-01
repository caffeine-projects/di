import { describe, it } from 'node:test'
import { expect } from 'expect'
import { DI } from '../DI.js'
import { Injectable } from '../decorators/Injectable.js'
import { FilterContext } from '../Filter.js'
import { optional } from '../injections/injections.js'

describe('Filters', function () {
  const wMap = new Map()

  function Custom(): <TFunction extends Function>(target: TFunction, context: ClassDecoratorContext) => void {
    return function (target: Function, context: DecoratorContext) {
      wMap.set(target, true)
    }
  }

  const filter = (ctx: FilterContext) => wMap.get(ctx.key) === true

  @Injectable()
  class Valid {}

  @Injectable()
  @Custom()
  class NonValid {}

  @Injectable([optional(NonValid)])
  class UsingNonValid {
    constructor(readonly nonValid?: NonValid) {}
  }

  describe('using a custom filter', function () {
    describe('when it doesnt match', function () {
      it('should not register the component in the container', function () {
        const di = new DI()

        di.addFilters(filter)
        di.setup()

        expect(di.has(Valid)).toBeTruthy()
        expect(di.has(NonValid)).toBeFalsy()
        expect(di.get(UsingNonValid).nonValid).toBeUndefined()
      })
    })
  })
})
