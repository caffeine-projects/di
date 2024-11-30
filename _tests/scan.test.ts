import { describe, it } from 'node:test'
import { expect } from 'expect'
import { DI } from '../DI.js'

describe('Auto Scan', function () {
  it('ensure scan doesnt fail', async function () {
    expect(() => DI.scan([])).not.toThrow()
  })
})
