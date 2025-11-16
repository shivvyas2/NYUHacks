declare module 'yuka' {
  export class Vector3 {
    x: number
    y: number
    z: number
    constructor(x?: number, y?: number, z?: number)
    set(x: number, y: number, z: number): this
    add(v: Vector3): this
    normalize(): this
    squaredLength(): number
  }

  export class GameEntity {
    position: Vector3
    velocity: Vector3
    rotation: any
    worldMatrix: THREE.Matrix4
    updateOrientation: boolean
    name?: string
    
    lookAt(target: Vector3): this
    rotateTo(target: Vector3, tolerance: number): this
    update(delta: number): this
  }

  export class Vehicle extends GameEntity {
    maxSpeed: number
    steering: SteeringManager
  }
  
  import * as THREE from 'three'

  export class SteeringManager {
    add(behavior: Behavior): void
    remove(behavior: Behavior): void
  }

  export class Behavior {
    active: boolean
  }

  export class SeekBehavior extends Behavior {
    constructor(target: Vector3)
    calculate(vehicle: Vehicle, force: Vector3): Vector3
  }

  export class WanderBehavior extends Behavior {
    constructor()
  }

  export class EntityManager {
    entities: GameEntity[]
    add(entity: GameEntity): void
    remove(entity: GameEntity): void
    update(delta: number): void
    getEntityByName(name: string): GameEntity | null
  }

  export class Time {
    constructor()
    update(): this
    getDelta(): number
  }

  export class State<T = any> {
    id?: string
    enter?(owner: T): void
    execute?(owner: T): void
    exit?(owner: T): void
  }

  export class StateMachine<T = any> {
    currentState: State<T> | null
    previousState: State<T> | null
    
    constructor(owner: T)
    add(id: string, state: State<T>): void
    changeTo(id: string): void
    update(): void
  }

  export class TriggerRegion {
    constructor()
  }

  export class RectangularTriggerRegion extends TriggerRegion {
    constructor(size: Vector3)
  }

  export class Trigger extends GameEntity {
    constructor(region: TriggerRegion)
    onTriggerEnter?(entity: GameEntity): void
    onTriggerLeave?(entity: GameEntity): void
  }

  export namespace MathUtils {
    function clamp(value: number, min: number, max: number): number
  }
}

