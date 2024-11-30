import { describe, it } from 'node:test'
import { Bean } from '../decorators/Bean'

import { Configuration } from '../decorators/Configuration'

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
  })
})
