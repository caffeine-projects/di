import { describe, it } from 'node:test'
import { expect } from 'expect'
import { inject } from './injections.js'

describe('inject()', function () {
  it('', function () {
    const k = Symbol.for('test')
    const result = inject(k, { optional: true, multiple: false, decorated: true })

    expect(result).toEqual({ token: k, optional: true, multiple: false, decorated: true, objectDescriptor: undefined })
  })
})
