import { describe, it } from 'node:test'
import { expect } from 'expect'
import { fmtKeyError } from '../errorFmt.js'
import { fmtParamError } from '../errorFmt.js'

describe('Error Fmt', function () {
  it('fmtParamError() should work with classes, functions', function () {
    const fn = () => 'test'

    class Dep {
      prop = 'test'
    }

    const fromFn = fmtParamError(fn, 0)
    const fromClazz = fmtParamError(Dep, 'prop')

    expect(fromFn).toContain("parameter at position '0'")
    expect(fromClazz).toContain(`property 'prop'`)
  })

  it('fmtKeyError()', function () {
    const tk = { key: 'test_token', tokenType: 'test_token_type' }
    const fromTkType = fmtKeyError(tk)

    expect(fromTkType).toContain(`test_token`)
  })
})
