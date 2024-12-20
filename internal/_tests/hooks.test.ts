import { describe, it } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { InternalHookListener } from '../InternalHookListener.js'

describe('Hook Listener', function () {
  it('should register and emit events multiple times', function () {
    const spy1 = Spy()
    const spy2 = Spy()
    const spy3 = Spy()
    const spy4 = Spy()

    const hooks = new InternalHookListener()

    hooks.on('onSetupComplete', spy1)
    hooks.on('onSetupComplete', spy2)
    hooks.once('onSetupComplete', spy3)
    hooks.on('onDisposed', spy4)

    hooks.emit('onSetupComplete')
    hooks.emit('onSetupComplete')

    expect(spy1).toHaveBeenCalledTimes(2)
    expect(spy2).toHaveBeenCalledTimes(2)
    expect(spy3).toHaveBeenCalledTimes(1)
    expect(spy4).not.toHaveBeenCalled()

    spy1.mockReset()
    spy2.mockReset()
    spy3.mockReset()
    spy4.mockReset()

    hooks.off('onSetupComplete', spy1)
    hooks.off('onDisposed', spy2)

    hooks.emit('onSetupComplete')
    hooks.emit('onSetupComplete')
    hooks.emit('onDisposed')

    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledTimes(2)
    expect(spy3).not.toHaveBeenCalled()
    expect(spy4).toHaveBeenCalled()

    spy1.mockReset()
    spy2.mockReset()
    spy3.mockReset()
    spy4.mockReset()

    hooks.removeAllListeners('onSetupComplete')

    hooks.emit('onSetupComplete')
    hooks.emit('onSetupComplete')
    hooks.emit('onDisposed')
    hooks.emit('onDisposed')

    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).not.toHaveBeenCalled()
    expect(spy3).not.toHaveBeenCalled()
    expect(spy4).toHaveBeenCalledTimes(2)
  })

  it('should fail trying to register the same function for the same event', function () {
    const spy = Spy()
    const hooks = new InternalHookListener()

    hooks.on('onSetupComplete', spy)

    expect(() => hooks.on('onSetupComplete', spy)).toThrow()
    expect(() => hooks.once('onSetupComplete', spy)).toThrow()
  })
})
