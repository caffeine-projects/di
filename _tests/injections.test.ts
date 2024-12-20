import { describe, it } from 'node:test'
import { expect } from 'expect'
import { inject } from '../injections/injections'

describe('inject()', function () {
  it('', function () {
    const k = Symbol.for('test')
    const result = inject(k, { optional: true, multiple: false, decorated: true })

    expect(result).toEqual({ key: k, optional: true, multiple: false, decorated: true, objectDescriptor: undefined })
  })
})
