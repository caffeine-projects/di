import { describe, it } from 'node:test'
import { expect } from 'expect'
import { notNil } from '../notNil.js'

describe('notNil', function () {
  it('should correctly throw only when value is null or undefined', function () {
    expect(() => notNil('test')).not.toThrow()
    expect(() => notNil(0)).not.toThrow()
    expect(() => notNil(false)).not.toThrow()
    expect(() => notNil([])).not.toThrow()
    expect(() => notNil({})).not.toThrow()
    expect(() => notNil(() => '')).not.toThrow()
    expect(() => notNil(null, 'fail')).toThrow('fail')
    expect(() => notNil(undefined)).toThrow()
  })
})
