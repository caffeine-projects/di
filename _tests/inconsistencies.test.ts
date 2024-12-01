import { describe, it } from 'node:test'
import { expect } from 'expect'
import { Injectable } from '../decorators/Injectable.js'
import { ErrInvalidBinding } from '../internal/errors.js'

import { Configuration } from '../decorators/Configuration'

describe('Inconsistencies', function () {
  it('should fail when passing a non named token to injectable', function () {
    expect(() => {
      class Ref {}

      @Injectable(Ref)
      class Fail {}
    }).toThrow(ErrInvalidBinding)
  })

  it('should fail when using injectable on method level without passing a valid token', function () {
    expect(() => {
      @Configuration()
      class Conf {
        @Injectable('')
        provide() {
          return ''
        }
      }
    }).toThrow(ErrInvalidBinding)
  })
})
