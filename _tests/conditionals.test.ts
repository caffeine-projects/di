import { describe, it, beforeEach } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { ConditionalOn } from '../decorators/ConditionalOn.js'
import { Bean } from '../decorators/Bean.js'
import { Injectable } from '../decorators/Injectable.js'
import { DI } from '../DI.js'
import { optional } from '../injections/injections.js'
import { Configuration } from '../decorators/Configuration'

describe('Conditionals', function () {
  describe('using default conditional', function () {
    class NonManaged {}

    @Injectable()
    class Managed {}

    @Injectable()
    @ConditionalOn(ctx => ctx.container.has(NonManaged))
    class NoPass {}

    @Injectable()
    @ConditionalOn(ctx => ctx.container.has(NonManaged), () => process.env.NODE === 'test')
    class NoPassToo {}

    @Injectable()
    @ConditionalOn(ctx => ctx.container.has(Managed))
    @ConditionalOn(() => true)
    class Pass {}

    @Injectable([Pass])
    class RefPassed {
      constructor(readonly pass: Pass) {}
    }

    @Injectable([NoPass])
    class RefNotPassed {
      constructor(readonly noPass: NoPass) {}
    }

    @Injectable([optional(NoPass)])
    class RefNotPassedOptional {
      constructor(readonly noPass?: NoPass) {}
    }

    it('should load component only when it pass on all provided conditionals', function () {
      const di = DI.setup()
      const refPassed = di.get(RefPassed)
      const opt = di.get(RefNotPassedOptional)

      expect(refPassed).toBeInstanceOf(RefPassed)
      expect(refPassed.pass).toBeInstanceOf(Pass)
      expect(opt).toBeInstanceOf(RefNotPassedOptional)
      expect(opt.noPass).toBeUndefined()
      expect(di.has(Pass)).toBeTruthy()
      expect(di.has(NoPass)).toBeFalsy()
      expect(di.has(NoPassToo)).toBeFalsy()
      expect(() => di.getRequired(RefNotPassed)).toThrow()
    })
  })

  describe('using on configuration class', function () {
    describe('and using the decorator on class level', function () {
      const spy1 = Spy()
      const spy2 = Spy()

      const kTxt = Symbol('txt')
      const kVal = Symbol('val')
      const kJson = Symbol('json')
      const kXml = Symbol('xml')

      @Configuration()
      @ConditionalOn(() => {
        spy1()
        return false
      })
      class NoConf {
        @Bean(kTxt)
        @ConditionalOn(() => {
          spy1()
          return true
        })
        txt() {
          return 'txt'
        }

        @Bean(kVal)
        val() {
          return 'val'
        }
      }

      @Configuration()
      @ConditionalOn(() => {
        spy2()
        return true
      })
      class Conf {
        @Bean(kJson)
        @ConditionalOn(() => {
          spy2()
          return true
        })
        @ConditionalOn(() => {
          spy2()
          return true
        })
        json() {
          return 'json'
        }

        @Bean(kXml)
        @ConditionalOn(() => {
          spy2()
          return false
        })
        @ConditionalOn(() => {
          spy2()
          return true
        })
        xml() {
          return 'xml'
        }
      }

      beforeEach(() => {
        spy1.mockReset()
        spy2.mockReset()
      })

      it('should merge the conditionals from class and method level', function () {
        const di = DI.setup()

        expect(di.has(NoConf)).toBeFalsy()
        expect(di.has(kTxt)).toBeFalsy()
        expect(di.has(kVal)).toBeFalsy()
        expect(spy1).toHaveBeenCalledTimes(1)

        expect(di.has(Conf)).toBeTruthy()
        expect(di.has(kJson)).toBeTruthy()
        expect(di.has(kXml)).toBeFalsy()
        expect(spy2).toHaveBeenCalledTimes(4)
      })
    })
  })

  describe('when more than one match', function () {
    abstract class Base {}

    @Injectable()
    class Svc1 extends Base {}

    @Injectable()
    @ConditionalOn(() => false)
    class Svc2 extends Base {}

    @Injectable()
    @ConditionalOn(() => false)
    class Svc3 extends Base {}

    it('should ignore the beans that doesnt pass the conditionals and use the one that is left', function () {
      const di = DI.setup()
      const svc = di.get(Base)

      expect(svc).toBeInstanceOf(Svc1)
    })
  })
})
