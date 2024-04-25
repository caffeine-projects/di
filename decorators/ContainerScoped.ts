import { Lifecycle } from '../Lifecycle.js'
import { Scoped } from './Scoped.js'

export const ContainerScoped = () => Scoped(Lifecycle.CONTAINER)
