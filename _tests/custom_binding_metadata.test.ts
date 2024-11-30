import { describe, it } from 'node:test'
import { expect } from 'expect'
import { DI } from '../DI.js'
import { Symbols } from '../Symbols.js'

describe('Custom Binding Metadata', function () {
  describe('when using a static factory method with Symbols.injections', function () {
    const kNm = Symbol('nm')

    class Dep {}

    class Opt {}

    class Nm {}

    class Root {
      constructor(
        readonly dep: any,
        readonly nm: any,
        readonly opt?: any,
      ) {}

      static get [Symbols.injections]() {
        return [Dep, kNm, { token: Opt, optional: true }]
      }
    }

    it('should resolve dependencies based on the return of the Symbols.injections function', function () {
      const di = DI.setup()

      di.bind(Dep).toSelf()
      di.bind(Nm).toSelf().qualifiers(kNm)
      di.bind(Root).toSelf()

      const root = di.get(Root)

      expect(root).toBeInstanceOf(Root)
      expect(root.dep).toBeInstanceOf(Dep)
      expect(root.nm).toBeInstanceOf(Nm)
      expect(root.opt).toBeUndefined()
    })
  })
})
