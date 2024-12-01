import { describe, it } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { v4 } from 'uuid'
import { DI } from '../DI.js'
import { Injectable } from '../decorators/Injectable.js'
import { PreDestroy } from '../decorators/PreDestroy.js'
import { Configuration } from '../decorators/Configuration'
import { Bean } from '../decorators/Bean'

describe('Container Operations', function () {
  describe('clearing', function () {
    @Injectable()
    class Dep {}

    it('should remove all registrations', function () {
      const di = DI.setup()
      const has = di.has(Dep)

      di.clear()

      expect(has).toBeTruthy()
      expect(di.has(Dep)).toBeFalsy()
    })
  })

  describe('resetting', function () {
    describe('sync', function () {
      const kValue = Symbol('test_reset_value')

      @Injectable([kValue])
      class Dep1 {
        readonly id: string = v4()

        constructor(readonly value: string) {}
      }

      @Injectable()
      class Dep2 {
        readonly id: string = v4()
      }

      const kDep3 = Symbol('dep_3')

      class Dep3 {
        readonly id: string = v4()
      }

      @Configuration()
      class Conf {
        @Bean(kDep3)
        dep3(): Dep3 {
          return new Dep2()
        }
      }

      const kDep4 = Symbol('dep_4')

      @Injectable(kDep4)
      class Dep4 {
        readonly id: string = v4()
      }

      it('should reset all instances, keeping value providers', function () {
        const di = DI.setup()

        di.bind(kValue).toValue('test')

        const dep11_1 = di.get(Dep1)
        const dep12_1 = di.get(Dep1)
        const dep21_1 = di.get(Dep2)
        const dep31_1 = di.get(kDep3)
        const dep32_1 = di.get(kDep3)
        const dep41_1 = di.get(kDep4)
        const dep42_1 = di.get(Dep4)

        di.resetInstances()

        const dep11_2 = di.get(Dep1)
        const dep22_2 = di.get(Dep2)
        const dep31_2 = di.get(kDep3)
        const dep41_2 = di.get(kDep4)

        expect(dep11_1).toEqual(dep12_1)
        expect(dep11_2).not.toEqual(dep11_1)
        expect(dep21_1).not.toEqual(dep22_2)
        expect(dep11_1.value).toEqual('test')
        expect(dep11_2.value).toEqual('test')
        expect(dep31_1).toEqual(dep32_1)
        expect(dep31_1).not.toEqual(dep31_2)
        expect(dep41_1).toEqual(dep42_1)
        expect(dep41_1).not.toEqual(dep41_2)
      })

      it('should reset only the requested instance', function () {
        const di = DI.setup()

        di.bind(kValue).toValue('test')

        const dep1 = di.get(Dep1)
        const dep2 = di.get(Dep2)
        const dep3 = di.get(kDep3)
        const dep4_1 = di.get(kDep4)
        const dep4_2 = di.get(Dep4)

        expect(dep4_1).toEqual(dep4_2)

        di.resetInstance(Dep1)
        di.resetInstance(kDep3)
        di.resetInstance(kDep4)

        const otherDep1 = di.get(Dep1)
        const otherDep2 = di.get(Dep2)
        const otherDep3 = di.get(kDep3)
        const otherDep4_1 = di.get(kDep4)
        const otherDep4_2 = di.get(Dep4)

        expect(otherDep4_1).toEqual(otherDep4_2)

        expect(dep1).not.toEqual(otherDep1)
        expect(dep2).toEqual(otherDep2)
        expect(dep3).not.toEqual(otherDep3)
        expect(dep4_1).not.toEqual(otherDep4_1)
        expect(dep4_2).not.toEqual(otherDep4_2)
      })
    })

    describe('async', function () {
      const kValue = Symbol('test_reset_value_async')
      const spy = Spy()

      @Injectable([kValue])
      class Dep1 {
        readonly id: string = v4()

        constructor(readonly value: string) {}

        @PreDestroy()
        destroy() {
          spy()
        }
      }

      @Injectable()
      class Dep2 {
        readonly id: string = v4()
      }

      @Injectable()
      class Dep3 {
        readonly id: string = v4()
      }

      it('should reset only the requested instance and call destroy hook if any', async function () {
        const di = DI.setup()

        di.bind(kValue).toValue('test')

        const dep1 = di.get(Dep1)
        const dep2 = di.get(Dep2)
        const dep3 = di.get(Dep3)

        await di.resetInstanceAsync(Dep1)
        await di.resetInstanceAsync(Dep2)

        const otherDep1 = di.get(Dep1)
        const otherDep2 = di.get(Dep2)
        const otherDep3 = di.get(Dep3)

        expect(dep1).not.toEqual(otherDep1)
        expect(dep2).not.toEqual(otherDep2)
        expect(dep3).toEqual(otherDep3)
        expect(spy).toHaveBeenCalledTimes(1)
      })
    })
  })
})
