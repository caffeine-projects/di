import { expect } from '@jest/globals'
import { jest } from '@jest/globals'
import { describe } from '@jest/globals'
import { Injectable } from '../decorators/Injectable.js'
import { Configuration } from '../decorators/Configuration'
import { Bean } from '../decorators/Bean'
import { TypeRegistrar } from '../internal/TypeRegistrar'

describe('simple', function () {
  it('should not fail', function () {
    class Service {}

    @Configuration()
    class ManyBeans {
      @Bean(Service)
      service(): Service {
        return new Service()
      }
    }

    console.log(TypeRegistrar)
  })
})
