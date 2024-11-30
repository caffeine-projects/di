import { describe, it } from 'node:test'
import { expect } from 'expect'
import { Injectable } from '../decorators/Injectable.js'
import { DI } from '../DI.js'
import { optional } from '../injections/injections.js'

describe('Optional Injections', function () {
  describe('with no default values', function () {
    class Repo {}

    interface Service {
      run(): void
    }

    @Injectable([optional(Repo)])
    class OptSvc {
      constructor(readonly repo?: Repo) {}
    }

    @Injectable([Repo])
    class NonSvc {
      constructor(readonly repo?: Repo) {}
    }

    @Injectable([optional('service')])
    class Ctrl {
      constructor(readonly service?: Service) {}
    }

    it('should inject undefined values when dependency cannot be resolved and is marked as optional', function () {
      const di = DI.setup()
      const svc = di.get(OptSvc)
      const ctrl = di.get(Ctrl)

      expect(svc.repo).toBeUndefined()
      expect(svc.repo).not.toBe(null)
      expect(() => di.get(NonSvc)).toThrow()
      expect(ctrl.service).toBeUndefined()
      expect(ctrl.service).not.toBe(null)
    })
  })

  describe('with default values', function () {
    const kVal = Symbol('test')

    class Dep {
      constructor(readonly value: string) {}
    }

    @Injectable()
    class Reg {}

    @Injectable([optional(kVal)])
    class OptStr {
      constructor(readonly value: string = 'optional') {}
    }

    @Injectable([Reg, optional(Dep)])
    class Test {
      constructor(
        readonly reg: Reg,
        readonly dep: Dep = new Dep('default value'),
      ) {}
    }

    it('should keep the optional value', function () {
      const di = DI.setup()
      const optStr = di.get(OptStr)
      const test = di.get(Test)

      expect(optStr.value).toEqual('optional')
      expect(test.reg).toBeInstanceOf(Reg)
      expect(test.dep).toBeInstanceOf(Dep)
      expect(test.dep.value).toEqual('default value')
    })
  })
})
