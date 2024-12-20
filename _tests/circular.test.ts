import { describe, it } from 'node:test'
import { expect } from 'expect'
import { newBinding } from '../Binding.js'
import { DI } from '../DI.js'
import { SimpleKeyedProvider } from '../internal/providers/SimpleKeyedProvider'
import { Bar } from './_testdata/circular/Bar.js'
import { Foo } from './_testdata/circular/Foo.js'

describe('Circular References', function () {
  describe('dependencies with deferred constructor', function () {
    it('should resolve dependencies', function () {
      const di = DI.setup()

      const foo = di.get(Foo)
      const bar = di.get(Bar)
      const foo2 = di.get(Foo)
      const bar2 = di.get(Bar)

      di.get(Foo)
      di.get(Bar)

      expect(foo.test()).toEqual('foo-bar')
      expect(bar.test()).toEqual('bar-foo')

      expect(foo2.test()).toEqual('foo-bar')
      expect(bar2.test()).toEqual('bar-foo')

      expect(foo.uuid).toEqual(foo2.uuid)
      expect(bar.uuid).not.toEqual(bar2.uuid)
    })
  })

  describe('attempt to register a injection pointing to itself', function () {
    it('should throw error', function () {
      const di = DI.setup()

      di.configureBinding('foo', newBinding({ rawProvider: new SimpleKeyedProvider('foo') }))

      expect(() => di.configureBinding('foo', newBinding({ rawProvider: new SimpleKeyedProvider('foo') }))).toThrow()
    })
  })
})
