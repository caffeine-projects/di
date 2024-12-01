import { describe, it } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { Binding } from '../Binding.js'
import { Injectable } from '../decorators/Injectable.js'
import { Named } from '../decorators/Named.js'
import { DI } from '../DI.js'
import { BuiltInMetadataReader } from '../internal/BuiltInMetadataReader.js'
import { Key } from '../Key'
import { MetadataReader } from '../MetadataReader.js'
import { optional } from '../injections/injections.js'

import { Configuration } from '../decorators/Configuration'

describe('DI', function () {
  const kTestName = Symbol('test-name')

  @Injectable()
  class Test {}

  @Injectable()
  class Dep {}

  class Opt {}

  @Injectable([Dep, optional(Opt)])
  @Named(kTestName)
  class NamedTest {
    constructor(
      readonly dep: Dep,
      readonly opt?: Opt,
    ) {}
  }

  it('should print the type name when calling toString()', function () {
    const di = DI.setup()
    di.bind('tk100').toValue('test')
    di.bind('tk200').toValue('test')

    const str = di.toString()
    const protoStr = Object.prototype.toString.call(di)

    expect(str).toContain('Test')
    expect(str).toContain('NamedTest')
    expect(str).toContain(kTestName.description)
    expect(str).toContain('tk100')
    expect(str).toContain('tk200')
    expect(protoStr).toEqual('[object DI]')
  })

  it('should allow to iterate all binding entries', function () {
    const di = DI.setup()
    const entries = new Map(di.entries())

    for (const [key, binding] of di.entries()) {
      expect(key).toBeDefined()
      expect(binding).toBeDefined()
    }

    expect(entries.has(NamedTest)).toBeTruthy()
    expect(entries.get(NamedTest)?.names).toContain(kTestName)
    expect(entries.has(Test)).toBeTruthy()
    expect(entries.size).toEqual(di.size)
  })

  it('should allow iterate all binding aliases', function () {
    const di = DI.setup()
    const aliases = new Map(di.qualifiers())
    const entries = new Map(di.entries())
    const named = entries.get(NamedTest)

    for (const [key, bindings] of di.qualifiers()) {
      expect(key).toBeDefined()
      expect(bindings).toBeInstanceOf(Array)
    }

    expect(aliases.has(kTestName)).toBeTruthy()
    expect(aliases.get(kTestName)?.[0]).toEqual(named)
  })

  it('should allow iteration direct on DI instance', function () {
    const di = DI.setup()
    const entries = new Map(di)

    for (const [key, binding] of di) {
      expect(key).toBeDefined()
      expect(binding).toBeDefined()
    }

    expect(entries.has(NamedTest)).toBeTruthy()
    expect(entries.get(NamedTest)?.names).toContain(kTestName)
    expect(entries.has(Test)).toBeTruthy()
    expect(entries.size).toEqual(di.size)
  })

  describe('when using a custom metadata reader', function () {
    it('should allow set an alternative metadata reader', function () {
      const spy = Spy()

      class Custom implements MetadataReader {
        constructor(private readonly original: MetadataReader) {}

        read(key: Key): Partial<Binding> {
          spy()
          return this.original.read(key)
        }
      }

      DI.setup({ metadataReader: new Custom(new BuiltInMetadataReader()) })

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('when asking for the configuration beans', function () {
    @Injectable()
    class Dep1 {}

    @Injectable()
    class Dep2 {}

    @Configuration()
    class Conf {}

    it('should return only class type keys decorated with @Configuration()', function () {
      const di = DI.setup()
      const conf = Array.from(di.configurationBeans())

      expect(conf).toHaveLength(1)
      expect(conf[0]).toEqual(Conf)
    })
  })

  // This test considers ALL injectable defined in this test file
  // --
  it('should return the number of registered components when calling size()', function () {
    const di = DI.setup()
    const userDefined = 6 // all injectables in this file
    const internals = 7 // DI internal beans
    const expected = userDefined + internals

    di.setup()
    di.setup()

    expect(di.size).toEqual(expected)
  })

  // describe('when "fail on incomplete binding" is true', function() {
  //   it('should fail setup when a binding is not injectable but contains method decorators', function () {
  //     class NonManaged {
  //       @PreDestroy()
  //       hi() {
  //       }
  //     }

  //     expect(() => DI.setup()).toThrow(IncompleteBindingError)
  //   })

  //   it('should fail setup when a binding is not injectable but contains property decorators', function () {
  //     class NonManaged {
  //       @Inject()
  //       message!: string
  //     }

  //     expect(() => DI.setup()).toThrow(IncompleteBindingError)
  //   })
  // })
})
