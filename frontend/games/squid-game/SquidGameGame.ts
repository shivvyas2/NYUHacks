import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import * as YUKA from 'yuka'
import { BaseGame } from '../BaseGame'
import { PLAYER_STATES, DOLL_STATES, PlayerState, DollState } from './types'

interface PlayerEntity extends YUKA.Vehicle {
  mixer: THREE.AnimationMixer
  animations: Map<string, THREE.AnimationAction>
  stateMachine: YUKA.StateMachine<PlayerEntity>
  input?: any
  npc: boolean
  onHit?: () => void
  behavior?: any
  _renderComponent?: THREE.Object3D
}

interface DollEntity extends YUKA.GameEntity {
  mixer: THREE.AnimationMixer
  animations: Map<string, THREE.AnimationAction>
  stateMachine: YUKA.StateMachine<DollEntity>
  timer: number | null
  name: string
  _renderComponent?: THREE.Object3D
}

interface EnemyEntity extends YUKA.GameEntity {
  mixer: THREE.AnimationMixer
  animations: Map<string, THREE.AnimationAction>
  stateMachine: YUKA.StateMachine<EnemyEntity>
  name: string
  _renderComponent?: THREE.Object3D
}

const ENEMY_STATES = {
  IDLE: 'IDLE',
  SHOOTING: 'SHOOTING',
}

/**
 * Squid Game - Red Light Green Light
 * Features:
 * - Player with animations (idle, running)
 * - Doll with red/green light states
 * - Enemy soldiers with shooting animations
 * - Question system (20 questions, 5 wrong answers limit)
 * - Audio (red light, green light, cocoma)
 * - 100 NPC players
 * - Timer and game logic
 */
export class SquidGameGame extends BaseGame {
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private entityManager!: YUKA.EntityManager
  private player!: PlayerEntity
  private doll!: DollEntity
  private enemies: EnemyEntity[] = []
  private controls!: any
  private assetsLoaded = false
  private loadingProgress = 0
  private loadingMessage = 'Initializing...'
  private gameStarted = false
  private timerInterval: any = null
  private animationFrameId: number | null = null
  
  // Question system
  private currentQuestion: any = null
  private questionsAnswered = 0
  private correctAnswers = 0
  private wrongAnswers = 0
  private maxWrongAnswers = 5
  private totalQuestions = 20
  private showQuestionOverlay = false
  
  // Audio
  private audioListener!: THREE.AudioListener
  private redLightAudio!: THREE.Audio
  private greenLightAudio!: THREE.Audio
  private cocomaAudio!: THREE.Audio

  init(): void {
    this.setState({
      score: 0,
      level: 1,
      lives: 1,
      isPaused: false,
      isGameOver: false,
      isGameStarted: false,
    })
  }

  async setupThreeJS(canvas: HTMLCanvasElement): Promise<void> {
    THREE.Cache.enabled = true

    // Create renderer with optimizations for 60 FPS
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    })
    // Limit pixel ratio to 2 for better performance while maintaining quality
    // This ensures 60 FPS even on high-DPI displays
    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('white')

    // Create camera - positioned to see player at start (z=50)
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 200)
    // Camera behind player looking toward finish line
    this.camera.position.set(0, 5, 55) // Behind player at z=50
    this.camera.lookAt(0, 0, 0) // Look toward center/finish line

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444)
    hemiLight.position.set(0, 100, 0)
    this.scene.add(hemiLight)

    const light = new THREE.DirectionalLight(0xffffff, 1.0)
    light.position.set(50, 20, 50)
    light.castShadow = true
    light.shadow.bias = -0.001
    // Reduced shadow map size for better performance (2048 is still high quality)
    light.shadow.mapSize.width = 2048
    light.shadow.mapSize.height = 2048
    light.shadow.camera.near = 0.1
    light.shadow.camera.far = 1000.0
    light.shadow.camera.left = 100
    light.shadow.camera.right = -100
    light.shadow.camera.top = 100
    light.shadow.camera.bottom = -100
    this.scene.add(light)

    // Create ground
    this.loadingProgress = 10
    this.loadingMessage = 'Creating environment...'
    const groundGeometry = new THREE.PlaneGeometry(30, 150)
    const groundTexture = new THREE.TextureLoader().load('/games/squid-game/assets/squid-textures/textures/Sand_baseColor.jpeg')
    const groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture })
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
    groundMesh.rotation.x = -Math.PI / 2
    groundMesh.receiveShadow = true
    this.scene.add(groundMesh)

    // Initialize YUKA
    this.entityManager = new YUKA.EntityManager()

    // Initialize audio listener
    this.audioListener = new THREE.AudioListener()
    this.camera.add(this.audioListener)

    // Load audio
    this.loadingProgress = 20
    this.loadingMessage = 'Loading audio...'
    await this.loadAudio()

    // Load models
    this.loadingProgress = 30
    this.loadingMessage = 'Loading models...'
    await this.loadModels()

    // Add triggers
    this.addTriggers()

    this.assetsLoaded = true
    this.loadingProgress = 100
    this.loadingMessage = 'Ready!'
  }

  async loadAudio(): Promise<void> {
    const audioLoader = new (THREE as any).AudioLoader()
    
    // Load red light audio
    this.redLightAudio = new THREE.Audio(this.audioListener)
    await new Promise<void>((resolve) => {
      audioLoader.load('/games/squid-game/audio/Redlight.mp3', (buffer: AudioBuffer) => {
        this.redLightAudio.setBuffer(buffer)
        this.redLightAudio.setVolume(0.7)
        resolve()
      }, undefined, () => resolve()) // Resolve even on error
    })

    // Load green light audio
    this.greenLightAudio = new THREE.Audio(this.audioListener)
    await new Promise<void>((resolve) => {
      audioLoader.load('/games/squid-game/audio/GreenLight.mp3', (buffer: AudioBuffer) => {
        this.greenLightAudio.setBuffer(buffer)
        this.greenLightAudio.setVolume(0.7)
        resolve()
      }, undefined, () => resolve())
    })

    // Load cocoma audio (plays after red light when people start running)
    this.cocomaAudio = new THREE.Audio(this.audioListener)
    await new Promise<void>((resolve) => {
      audioLoader.load('/games/squid-game/audio/Cocoma.mp3', (buffer: AudioBuffer) => {
        this.cocomaAudio.setBuffer(buffer)
        this.cocomaAudio.setVolume(0.7)
        resolve()
      }, undefined, () => resolve())
    })
  }

  async loadModels(): Promise<void> {
    await this.addPlayer()
    this.loadingProgress = 40

    await Promise.all([
      this.addWalls(),
      this.addTree(),
      this.addDoll(),
    ])
    this.loadingProgress = 60

    await this.addEnemies()
    this.loadingProgress = 70

    await this.addNpcPlayers()
    this.loadingProgress = 80
  }

  // Generate placeholder questions (will be replaced with AI-generated JSON in future)
  generateQuestion(): any {
    const questions = [
      {
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1
      },
      {
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2
      },
      {
        question: 'What is 5 × 3?',
        options: ['10', '15', '20', '25'],
        correctAnswer: 1
      },
      {
        question: 'What is the largest planet in our solar system?',
        options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 2
      },
      {
        question: 'What is 10 - 4?',
        options: ['4', '5', '6', '7'],
        correctAnswer: 2
      },
      {
        question: 'What is the chemical symbol for water?',
        options: ['H2O', 'CO2', 'O2', 'NaCl'],
        correctAnswer: 0
      },
      {
        question: 'What is 8 ÷ 2?',
        options: ['2', '3', '4', '5'],
        correctAnswer: 2
      },
      {
        question: 'What is the smallest prime number?',
        options: ['0', '1', '2', '3'],
        correctAnswer: 2
      },
      {
        question: 'What is 3²?',
        options: ['6', '9', '12', '15'],
        correctAnswer: 1
      },
      {
        question: 'What is the square root of 16?',
        options: ['2', '4', '6', '8'],
        correctAnswer: 1
      },
      {
        question: 'What is 7 + 8?',
        options: ['13', '14', '15', '16'],
        correctAnswer: 2
      },
      {
        question: 'What is the capital of Japan?',
        options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'],
        correctAnswer: 2
      },
      {
        question: 'What is 12 ÷ 3?',
        options: ['2', '3', '4', '5'],
        correctAnswer: 2
      },
      {
        question: 'What is the speed of light in vacuum?',
        options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'],
        correctAnswer: 0
      },
      {
        question: 'What is 4 × 5?',
        options: ['15', '20', '25', '30'],
        correctAnswer: 1
      },
      {
        question: 'What is the largest ocean?',
        options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
        correctAnswer: 3
      },
      {
        question: 'What is 9 - 3?',
        options: ['4', '5', '6', '7'],
        correctAnswer: 2
      },
      {
        question: 'What is 6²?',
        options: ['30', '36', '42', '48'],
        correctAnswer: 1
      },
      {
        question: 'What is the capital of Australia?',
        options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
        correctAnswer: 2
      },
      {
        question: 'What is 15 ÷ 5?',
        options: ['2', '3', '4', '5'],
        correctAnswer: 1
      }
    ]

    // Return a random question
    return questions[Math.floor(Math.random() * questions.length)]
  }

  async addPlayer(): Promise<void> {
    const fbxLoader = new FBXLoader()
    
    return new Promise((resolve, reject) => {
      // Load standingidleplayer.fbx as the base model (it contains both model and idle animation)
      fbxLoader.load(
        '/games/squid-game/assets/standingidleplayer.fbx',
        (fbx) => {
          const renderComponent = fbx
          renderComponent.scale.set(0.01, 0.01, 0.01) // FBX files are usually in cm, scale down
          renderComponent.matrixAutoUpdate = false
          renderComponent.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })
          this.scene.add(renderComponent)

          // Create mixer from the FBX model
          const mixer = new THREE.AnimationMixer(renderComponent)
          const animations = new Map<string, THREE.AnimationAction>()
          
          // Load idle animation from the base FBX file
          if (fbx.animations && fbx.animations.length > 0) {
            const clip = fbx.animations[0]
            const action = mixer.clipAction(clip)
            action.setLoop(THREE.LoopRepeat, Infinity)
            action.enabled = false
            action.setEffectiveWeight(0)
            animations.set(PLAYER_STATES.IDLE, action)
            console.log('Loaded IDLE animation from standingidleplayer.fbx')
          }
          
          // Load Goofy Running.fbx animation
          let loadedAnimations = 1 // We already have idle
          const totalAnimations = 2 // Idle and Run
          
          const onAnimationLoaded = () => {
            loadedAnimations++
            if (loadedAnimations >= totalAnimations) {
              // All animations loaded, create player entity
              this.createPlayerEntity(renderComponent, mixer, animations, resolve, reject)
            }
          }
          
          fbxLoader.load(
            '/games/squid-game/assets/Goofy Running.fbx',
            (runFbx) => {
              if (runFbx.animations && runFbx.animations.length > 0) {
                // Try to apply the running animation to our base model
                const clip = runFbx.animations[0]
                try {
                  // Create action using the clip from running FBX, applied to our base model
                  const action = mixer.clipAction(clip, renderComponent)
                  action.setLoop(THREE.LoopRepeat, Infinity)
                  action.enabled = false
                  action.setEffectiveWeight(0)
                  // Set time scale to make animation smoother (slightly slower can help)
                  action.setEffectiveTimeScale(1.0)
                  // Randomize start time slightly to avoid all characters syncing
                  action.time = Math.random() * clip.duration
                  animations.set(PLAYER_STATES.RUN, action)
                  console.log('Loaded RUN animation from Goofy Running.fbx')
                  
                  // Also use running for walk state
                  const walkAction = mixer.clipAction(clip, renderComponent)
                  walkAction.setLoop(THREE.LoopRepeat, Infinity)
                  walkAction.enabled = false
                  walkAction.setEffectiveWeight(0)
                  walkAction.setEffectiveTimeScale(0.8) // Slightly slower for walk
                  walkAction.time = Math.random() * clip.duration
                  animations.set(PLAYER_STATES.WALK, walkAction)
                } catch (error) {
                  console.warn('Failed to apply running animation to base model:', error)
                  // If retargeting fails, clone the clip and try again
                  try {
                    const clonedClip = clip.clone()
                    const action = mixer.clipAction(clonedClip, renderComponent)
                    action.setLoop(THREE.LoopRepeat, Infinity)
                    action.enabled = false
                    action.setEffectiveWeight(0)
                    animations.set(PLAYER_STATES.RUN, action)
                    
                    const walkAction = mixer.clipAction(clonedClip, renderComponent)
                    walkAction.setLoop(THREE.LoopRepeat, Infinity)
                    walkAction.enabled = false
                    walkAction.setEffectiveWeight(0)
                    animations.set(PLAYER_STATES.WALK, walkAction)
                    console.log('Successfully applied running animation using cloned clip')
                  } catch (cloneError) {
                    console.error('Failed to apply running animation even with cloned clip:', cloneError)
                    // Use idle as fallback
                    const fallbackAction = animations.get(PLAYER_STATES.IDLE)
                    if (fallbackAction) {
                      animations.set(PLAYER_STATES.RUN, fallbackAction)
                      animations.set(PLAYER_STATES.WALK, fallbackAction)
                    }
                  }
                }
              } else {
                console.warn('Goofy Running.fbx has no animations')
              }
              onAnimationLoaded()
            },
            undefined,
            (error) => {
              console.warn('Failed to load Goofy Running.fbx:', error)
              // Use idle as fallback for run/walk
              const fallbackAction = animations.get(PLAYER_STATES.IDLE)
              if (fallbackAction) {
                animations.set(PLAYER_STATES.RUN, fallbackAction)
                animations.set(PLAYER_STATES.WALK, fallbackAction)
              }
              onAnimationLoaded()
            }
          )
          
          // Add fallback animations if needed
          if (!animations.has(PLAYER_STATES.RUN)) {
            // Use idle as fallback
            const fallbackAction = animations.get(PLAYER_STATES.IDLE)
            if (fallbackAction) {
              animations.set(PLAYER_STATES.RUN, fallbackAction)
              animations.set(PLAYER_STATES.WALK, fallbackAction)
            }
          }
          // Set dead and dance animations (use idle as fallback)
          const idleAction = animations.get(PLAYER_STATES.IDLE)
          if (idleAction) {
            animations.set(PLAYER_STATES.DEAD, idleAction)
            animations.set(PLAYER_STATES.DANCE, idleAction)
          }
        },
        undefined,
        reject
      )
    })
  }
  
  createPlayerEntity(
    renderComponent: THREE.Object3D,
    mixer: THREE.AnimationMixer,
    animations: Map<string, THREE.AnimationAction>,
    resolve: () => void,
    reject: (error: any) => void
  ): void {
    try {
      this.player = new YUKA.Vehicle() as PlayerEntity
      this.player.mixer = mixer
      this.player.animations = animations
      this.player.npc = false
      ;(this.player as any).maxSpeed = 2
      ;(this.player as any).updateOrientation = true
      // Initialize velocity if not already set
      if (!(this.player as any).velocity) {
        ;(this.player as any).velocity = new YUKA.Vector3()
      }
      // Position player at START (positive Z = start, negative Z = finish line)
      ;(this.player as any).position.set(0, 0, 50)
      this.player._renderComponent = renderComponent
      
      // Set initial render component position from entity position
      renderComponent.position.set(
        (this.player as any).position.x,
        (this.player as any).position.y,
        (this.player as any).position.z
      )
      // Make player face toward doll (negative Z direction)
      renderComponent.lookAt(0, 0, -52)
      renderComponent.updateMatrix()
      
      console.log('Player positioned at:', (this.player as any).position)
      this.player.onHit = () => {
        this.setState({ isGameOver: true })
        this.gameStarted = false
      }
      
      // Setup state machine
      this.player.stateMachine = new YUKA.StateMachine(this.player)
      this.setupPlayerStateMachine(this.player)
      this.player.stateMachine.changeTo(PLAYER_STATES.IDLE)
      
      this.entityManager.add(this.player)
      this.initControls()
      
      resolve()
    } catch (error) {
      reject(error)
    }
  }

  setupPlayerStateMachine(player: PlayerEntity): void {
    // Idle state
    const idleState = new YUKA.State()
    idleState.enter = () => {
      const idle = player.animations.get(PLAYER_STATES.IDLE)
      const previousState = player.stateMachine.previousState
      if (idle) {
        // Stop all other animations first
        player.animations.forEach((action, state) => {
          if (state !== PLAYER_STATES.IDLE && action.isRunning()) {
            action.stop()
            action.enabled = false
            action.setEffectiveWeight(0)
          }
        })
        
        if (previousState && previousState.id) {
          const previousAnimation = player.animations.get(previousState.id)
          if (previousAnimation && previousAnimation.isRunning()) {
            idle.time = 0.0
            idle.enabled = true
            idle.setEffectiveTimeScale(1.0)
            idle.setEffectiveWeight(1.0)
            idle.crossFadeFrom(previousAnimation, 0.5, true)
          } else {
            idle.enabled = true
            idle.setEffectiveWeight(1.0)
            idle.play()
          }
        } else {
          idle.enabled = true
          idle.setEffectiveWeight(1.0)
          idle.play()
        }
        console.log('Playing IDLE animation')
      }
    }
    idleState.execute = () => {
      const p = player as any
      if (p.input && !p.npc) {
        if (p.input.forward || p.input.backward || p.input.left || p.input.right) {
          p.stateMachine.changeTo(PLAYER_STATES.WALK)
        }
      }
    }
    player.stateMachine.add(PLAYER_STATES.IDLE, idleState)

    // Walk state
    const walkState = new YUKA.State()
    walkState.enter = () => {
      const walk = player.animations.get(PLAYER_STATES.WALK)
      const previousState = player.stateMachine.previousState
      if (walk) {
        if (previousState && previousState.id) {
          const previousAnimation = player.animations.get(previousState.id)
          if (previousAnimation) {
            walk.enabled = true
            if (previousState.id === PLAYER_STATES.RUN) {
              const ratio = walk.getClip().duration / previousAnimation.getClip().duration
              walk.time = previousAnimation.time * ratio
            } else {
              walk.time = 0.0
              walk.setEffectiveTimeScale(1.0)
              walk.setEffectiveWeight(1.0)
            }
            walk.crossFadeFrom(previousAnimation, 0.5, true)
          } else {
            walk.enabled = true
            walk.setEffectiveWeight(1.0)
            walk.play()
          }
        } else {
          walk.enabled = true
          walk.setEffectiveWeight(1.0)
          walk.play()
        }
      }
    }
    walkState.execute = () => {
      const p = player as any
      if (p.input) {
        if (p.input.forward || p.input.backward || p.input.left || p.input.right) {
          if (p.input.shift) {
            p.stateMachine.changeTo(PLAYER_STATES.RUN)
          }
          return
        }
        p.stateMachine.changeTo(PLAYER_STATES.IDLE)
      }
    }
    player.stateMachine.add(PLAYER_STATES.WALK, walkState)

    // Run state
    const runState = new YUKA.State()
    runState.enter = () => {
      const run = player.animations.get(PLAYER_STATES.RUN)
      const previousState = player.stateMachine.previousState
      if (run) {
        // Stop all other animations first
        player.animations.forEach((action, state) => {
          if (state !== PLAYER_STATES.RUN && action.isRunning()) {
            action.stop()
            action.enabled = false
            action.setEffectiveWeight(0)
          }
        })
        
        if (previousState && previousState.id) {
          const previousAnimation = player.animations.get(previousState.id)
          if (previousAnimation && previousAnimation.isRunning()) {
            run.enabled = true
            if (previousState.id === PLAYER_STATES.WALK) {
              // Smooth transition from walk to run - maintain timing
              const ratio = run.getClip().duration / previousAnimation.getClip().duration
              run.time = previousAnimation.time * ratio
            } else {
              // If coming from idle, start at a random point in the animation cycle
              // This helps avoid the repetitive look
              const clip = run.getClip()
              run.time = Math.random() * clip.duration
            }
            run.setEffectiveTimeScale(1.0)
            run.setEffectiveWeight(1.0)
            // Use longer cross-fade for smoother transition
            run.crossFadeFrom(previousAnimation, 0.3, true)
          } else {
            run.enabled = true
            // Start at random point to avoid repetitive look
            const clip = run.getClip()
            run.time = Math.random() * clip.duration
            run.setEffectiveTimeScale(1.0)
            run.setEffectiveWeight(1.0)
            run.play()
          }
        } else {
          run.enabled = true
          // Start at random point to avoid repetitive look
          const clip = run.getClip()
          run.time = Math.random() * clip.duration
          run.setEffectiveTimeScale(1.0)
          run.setEffectiveWeight(1.0)
          run.play()
        }
        console.log('Playing RUN animation')
      } else {
        console.warn('RUN animation not found!')
      }
    }
    // Update run state to add slight variation during execution
    runState.execute = () => {
      const run = player.animations.get(PLAYER_STATES.RUN)
      if (run && run.isRunning()) {
        // Add subtle time scale variation periodically to make it less repetitive
        // Only update every few frames to avoid jittery animation
        const frameCount = (run as any).__frameCount || 0
        if (frameCount % 60 === 0) { // Update every 60 frames (~1 second at 60fps)
          const baseTimeScale = 1.0
          const variation = 0.03 // 3% variation (reduced for smoother feel)
          const timeScale = baseTimeScale + (Math.random() - 0.5) * variation
          run.setEffectiveTimeScale(timeScale)
        }
        ;(run as any).__frameCount = ((run as any).__frameCount || 0) + 1
        if ((run as any).__frameCount >= 60) {
          ;(run as any).__frameCount = 0
        }
      }
      
      const p = player as any
      if (p.input && !p.npc) {
        if (p.input.forward || p.input.backward || p.input.left || p.input.right) {
          if (!p.input.shift) {
            p.stateMachine.changeTo(PLAYER_STATES.WALK)
          }
          return
        }
        p.stateMachine.changeTo(PLAYER_STATES.IDLE)
      }
    }
    player.stateMachine.add(PLAYER_STATES.RUN, runState)

    // Dead state
    const deadState = new YUKA.State()
    deadState.enter = () => {
      const dead = (player as any).animations.get(PLAYER_STATES.DEAD)
      const previousState = player.stateMachine.previousState
      if (dead) {
        if (previousState && previousState.id) {
          const previousAnimation = player.animations.get(previousState.id)
          if (previousAnimation) {
            dead.enabled = true
            dead.crossFadeFrom(previousAnimation, 0.3, false)
          } else {
            dead.enabled = true
            dead.play()
          }
        } else {
          dead.enabled = true
          dead.play()
        }
        dead.setLoop(THREE.LoopOnce, 1)
        dead.clampWhenFinished = true
      }
      ;(player as any).velocity = new YUKA.Vector3()
    }
    player.stateMachine.add(PLAYER_STATES.DEAD, deadState)

    // Dance state
    const danceState = new YUKA.State()
    danceState.enter = () => {
      const dance = (player as any).animations.get(PLAYER_STATES.DANCE)
      const previousState = player.stateMachine.previousState
      ;(player as any).velocity = new YUKA.Vector3()
      if (dance) {
        if (previousState && previousState.id) {
          const previousAnimation = player.animations.get(previousState.id)
          if (previousAnimation) {
            dance.enabled = true
            if (previousState.id === PLAYER_STATES.WALK || previousState.id === PLAYER_STATES.RUN) {
              const ratio = dance.getClip().duration / previousAnimation.getClip().duration
              dance.time = previousAnimation.time * ratio
            } else {
              dance.time = 0.0
              dance.setEffectiveTimeScale(1.0)
              dance.setEffectiveWeight(1.0)
            }
            dance.crossFadeFrom(previousAnimation, 0.5, true)
          } else {
            dance.enabled = true
            dance.setEffectiveWeight(1.0)
            dance.play()
          }
        } else {
          dance.enabled = true
          dance.setEffectiveWeight(1.0)
          dance.play()
        }
      }
    }
    player.stateMachine.add(PLAYER_STATES.DANCE, danceState)
  }

  initControls(): void {
    this.controls = {
      input: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        shift: false,
      },
      cameraOffset: new YUKA.Vector3(0, 5, 10),
      cameraMovementSpeed: 2.5,
      brakingForce: 10,
    }
  }

  async addDoll(): Promise<void> {
    const gltfLoader = new GLTFLoader()
    const fbxLoader = new FBXLoader()
    
    return new Promise((resolve, reject) => {
      gltfLoader.load(
        '/games/squid-game/assets/squidgamedoll/scene.gltf',
        (gltf) => {
          const renderComponent = gltf.scene
          // Make doll larger than player but not too huge
          renderComponent.scale.set(6, 6, 6)
          renderComponent.matrixAutoUpdate = false
          renderComponent.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })
          this.scene.add(renderComponent)

          const mixer = new THREE.AnimationMixer(renderComponent)
          const animations = new Map()
          
          // Load Shooting Gun.fbx animation for the doll
          fbxLoader.load(
            '/games/squid-game/assets/Shooting Gun.fbx',
            (fbx) => {
              if (fbx.animations && fbx.animations.length > 0) {
                const clip = fbx.animations[0]
                const action = mixer.clipAction(clip)
                action.setLoop(THREE.LoopOnce, 1)
                action.enabled = false
                action.setEffectiveWeight(0)
                action.clampWhenFinished = true
                animations.set('SHOOTING', action)
              }
              
              this.doll = new YUKA.GameEntity() as DollEntity
              this.doll.mixer = mixer
              this.doll.animations = animations
              // Position doll at FINISH LINE (negative Z)
              ;(this.doll as any).position.set(0, 0, -52)
              ;(this.doll as any).lookAt(new YUKA.Vector3(0, 0, 50))
              ;(this.doll as any).updateOrientation = true
              this.doll.timer = null
              this.doll.name = 'doll'
              ;(this.doll as any)._renderComponent = renderComponent
              
              // Set initial render component position from entity position
              renderComponent.position.set(
                (this.doll as any).position.x,
                (this.doll as any).position.y,
                (this.doll as any).position.z
              )
              // Set rotation to look at player (positive Z direction)
              renderComponent.lookAt(0, 0, 50)
              renderComponent.updateMatrix()
              
              console.log('Doll positioned at:', (this.doll as any).position)

              // Setup doll state machine
              this.setupDollStateMachine()
              
              this.entityManager.add(this.doll)
              resolve()
            },
            undefined,
            (error) => {
              console.warn('Failed to load Shooting Gun.fbx:', error)
              // Continue without shooting animation
              this.doll = new YUKA.GameEntity() as DollEntity
              this.doll.mixer = mixer
              this.doll.animations = animations
              
              // Position doll at FINISH LINE (negative Z)
              ;(this.doll as any).position.set(0, 0, -52)
              ;(this.doll as any).lookAt(new YUKA.Vector3(0, 0, 50))
              ;(this.doll as any).updateOrientation = true
              this.doll.timer = null
              this.doll.name = 'doll'
              ;(this.doll as any)._renderComponent = renderComponent
              
              renderComponent.position.set(
                (this.doll as any).position.x,
                (this.doll as any).position.y,
                (this.doll as any).position.z
              )
              renderComponent.lookAt(0, 0, 50)
              renderComponent.updateMatrix()
              
              this.setupDollStateMachine()
              this.entityManager.add(this.doll)
              resolve()
            }
          )
        },
        undefined,
        reject
      )
    })
  }

  setupDollStateMachine(): void {
    this.doll.stateMachine = new YUKA.StateMachine(this.doll)

    // Green Light State
    const greenLightState = new YUKA.State()
    greenLightState.enter = () => {
      // Doll faces away from players (original: Vector3(0, 0, -100))
      ;(this.doll as any).rotateTo(new YUKA.Vector3(0, 0, -100), 1)
      // Update render component to face away from players
      const renderComponent = (this.doll as any)._renderComponent
      if (renderComponent) {
        renderComponent.lookAt(0, 0, -100)
        renderComponent.updateMatrix()
        // Make doll eyes green (if possible)
        this.setDollEyeColor(0x00ff00)
      }
      
      // Hide question overlay
      this.showQuestionOverlay = false
      this.currentQuestion = null
      
      // Stop red light audio if playing
      if (this.redLightAudio && this.redLightAudio.isPlaying) {
        this.redLightAudio.stop()
      }
      
      // Play green light audio
      if (this.greenLightAudio && !this.greenLightAudio.isPlaying) {
        this.greenLightAudio.play()
      }
      
      // Play cocoma audio after green light starts
      if (this.cocomaAudio && !this.cocomaAudio.isPlaying) {
        setTimeout(() => {
          if (this.cocomaAudio && !this.cocomaAudio.isPlaying) {
            this.cocomaAudio.play()
          }
        }, 500)
      }
    }
    this.doll.stateMachine.add(DOLL_STATES.GREEN_LIGHT, greenLightState)

    // Red Light State  
    const redLightState = new YUKA.State()
    redLightState.enter = () => {
      // Doll faces players (looking at them) - slight random direction for fun
      const lookDirection = new YUKA.Vector3(
        (Math.random() - 0.5) * 10, // Random x offset (reduced from 20)
        0,
        50 + (Math.random() - 0.5) * 10  // Look toward players with slight randomness
      )
      ;(this.doll as any).rotateTo(lookDirection, 1)
      // Update render component to face players (with slight randomness)
      const renderComponent = (this.doll as any)._renderComponent
      if (renderComponent) {
        renderComponent.lookAt(lookDirection.x, 0, lookDirection.z)
        renderComponent.updateMatrix()
        // Make doll eyes red
        this.setDollEyeColor(0xff0000)
      }
      
      // Stop green light and cocoma audio
      if (this.greenLightAudio && this.greenLightAudio.isPlaying) {
        this.greenLightAudio.stop()
      }
      if (this.cocomaAudio && this.cocomaAudio.isPlaying) {
        this.cocomaAudio.stop()
      }
      
      // Play red light audio
      if (this.redLightAudio && !this.redLightAudio.isPlaying) {
        this.redLightAudio.play()
      }
      
      // Show question overlay
      this.currentQuestion = this.generateQuestion()
      this.showQuestionOverlay = true
      
      // Reset movement check timer
      ;(this.doll as any).lastMovementCheck = Date.now()
      
      // Search for moving players immediately when red light starts
      this.searchForMovingPlayers()
    }
    redLightState.execute = () => {
      // Search for moving players during red light (but not every frame to avoid performance issues)
      // Players must freeze (statue) during red light or they will be killed
      // Only check for movement if not answering questions
      // Use a counter to check periodically (every ~0.5 seconds) instead of every frame
      const currentTime = Date.now()
      if (!this.showQuestionOverlay && (!(this.doll as any).lastMovementCheck || currentTime - (this.doll as any).lastMovementCheck > 500)) {
        this.searchForMovingPlayers()
        ;(this.doll as any).lastMovementCheck = currentTime
      }
    }
    this.doll.stateMachine.add(DOLL_STATES.RED_LIGHT, redLightState)

    // Eliminate All State
    const eliminateAllState = new YUKA.State()
    eliminateAllState.enter = () => {
      ;(this.doll as any).rotateTo(new YUKA.Vector3(0, 0, 50), 1)
      // Update render component to face players
      const renderComponent = (this.doll as any)._renderComponent
      if (renderComponent) {
        renderComponent.lookAt(0, 0, 50)
        renderComponent.updateMatrix()
      }
      // Play shooting animation
      this.playShootingAnimation()
      this.eliminateAll()
    }
    eliminateAllState.execute = () => {
      this.eliminateAll()
    }
    this.doll.stateMachine.add(DOLL_STATES.ELIMINATE_ALL, eliminateAllState)
  }
  
  playShootingAnimation(): void {
    const shootingAnimation = (this.doll as any).animations.get('SHOOTING')
    if (shootingAnimation) {
      shootingAnimation.reset()
      shootingAnimation.enabled = true
      shootingAnimation.setEffectiveWeight(1.0)
      shootingAnimation.play()
    }
    
    // Make enemies shoot
    this.enemies.forEach((enemy) => {
      if (enemy.stateMachine) {
        enemy.stateMachine.changeTo(ENEMY_STATES.SHOOTING)
      }
    })
  }

  setDollEyeColor(color: number): void {
    // Try to find and set eye color on doll model
    const renderComponent = (this.doll as any)._renderComponent
    if (renderComponent) {
      renderComponent.traverse((child: any) => {
        if (child.isMesh && child.material) {
          // Look for eye materials or meshes
          if (child.name.toLowerCase().includes('eye') || 
              (child.material.name && child.material.name.toLowerCase().includes('eye'))) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat: any) => {
                if (mat.emissive) {
                  mat.emissive.setHex(color)
                  mat.emissiveIntensity = 1.0
                }
              })
            } else {
              if (child.material.emissive) {
                child.material.emissive.setHex(color)
                child.material.emissiveIntensity = 1.0
              }
            }
          }
        }
      })
    }
  }

  handleQuestionAnswer(selectedOption: number): void {
    if (!this.currentQuestion || !this.showQuestionOverlay) return

    const isCorrect = selectedOption === this.currentQuestion.correctAnswer
    this.questionsAnswered++
    
    if (isCorrect) {
      this.correctAnswers++
      // Move player forward based on progress (5 units per correct answer)
      if (this.player) {
        const moveDistance = 5
        this.player.position.z -= moveDistance
        // Clamp to prevent going past finish line
        this.player.position.z = Math.max(this.player.position.z, -52)
      }
    } else {
      this.wrongAnswers++
      // Shoot player for wrong answer
      this.playShootingAnimation()
      if (this.player && this.player.onHit) {
        // Don't kill immediately, just mark as hit
        // Player dies after 5 wrong answers
      }
      
      // Check if player has exceeded wrong answer limit
      if (this.wrongAnswers >= this.maxWrongAnswers) {
        // Kill player
        if (this.player) {
          this.player.stateMachine.changeTo(PLAYER_STATES.DEAD)
          if (this.player.onHit) {
            this.player.onHit()
          }
          this.setState({ isGameOver: true })
          this.gameStarted = false
        }
      }
    }

    // Hide question overlay
    this.showQuestionOverlay = false
    this.currentQuestion = null

    // Check if player has answered all questions correctly
    if (this.correctAnswers >= this.totalQuestions) {
      // Player wins - they can cross the finish line
      // The finish line trigger will handle victory
    }
  }

  searchForMovingPlayers(): void {
    // Find all players (including NPCs) that are moving during red light
    const movingPlayers = this.entityManager.entities
      .filter((entity: any): entity is PlayerEntity => 
        entity.stateMachine && 
        entity.stateMachine.currentState &&
        (entity === this.player || entity.npc) // Only check player and NPCs
      )
      .filter((entity: any) => {
        const id = entity.stateMachine.currentState?.id
        // Players moving (walk/run) during red light will be eliminated
        return id === PLAYER_STATES.WALK || id === PLAYER_STATES.RUN
      })
    
    if (movingPlayers.length > 0) {
      // Play shooting animation when players are caught moving
      this.playShootingAnimation()
      
      // Make enemies (red soldiers) shoot when players are caught
      this.enemies.forEach((enemy) => {
        if (enemy.stateMachine) {
          enemy.stateMachine.changeTo(ENEMY_STATES.SHOOTING)
        }
      })
      
      // Eliminate all moving players
      movingPlayers.forEach((entity: any) => {
        if (entity === this.player) {
          // Player is eliminated - game over
          entity.stateMachine.changeTo(PLAYER_STATES.DEAD)
          this.setState({ isGameOver: true })
          this.gameStarted = false
        } else if (entity.npc) {
          // NPC is eliminated
          entity.stateMachine.changeTo(PLAYER_STATES.DEAD)
          if (entity.behavior) {
            entity.behavior.active = false
          }
        }
      })
    }
  }

  eliminateAll(): void {
    // Make all enemies shoot
    this.enemies.forEach((enemy) => {
      if (enemy.stateMachine) {
        enemy.stateMachine.changeTo(ENEMY_STATES.SHOOTING)
      }
    })

    this.entityManager.entities
      .filter((entity: any): entity is PlayerEntity => 
        entity.stateMachine && 
        entity.stateMachine.currentState
      )
      .filter((entity: any) => {
        const id = entity.stateMachine.currentState?.id
        return id !== PLAYER_STATES.DEAD && id !== PLAYER_STATES.DANCE
      })
      .forEach((entity: any) => {
        if (entity.onHit) {
          entity.stateMachine.changeTo(PLAYER_STATES.DEAD)
          entity.onHit()
        }
      })
  }

  async addEnemies(): Promise<void> {
    // Add enemies positioned ahead of doll (closer to player) so doll is at the end
    const enemyPositions = [
      { x: 3, y: 0, z: -30 },   // Right side, ahead of doll
      { x: -3, y: 0, z: -30 },  // Left side, ahead of doll
      { x: 6, y: 0, z: -28 },   // Further right, ahead of doll
      { x: -6, y: 0, z: -28 },  // Further left, ahead of doll
    ]

    const promises = enemyPositions.map((pos) => this.addEnemy(pos.x, pos.y, pos.z))
    await Promise.all(promises)
  }

  async addEnemy(x: number, y: number, z: number): Promise<void> {
    const fbxLoader = new FBXLoader()
    
    return new Promise((resolve, reject) => {
      // Load Standing Idle.fbx as the base model for enemies
      fbxLoader.load(
        '/games/squid-game/assets/Standing Idle.fbx',
        (fbx) => {
          const renderComponent = fbx
          // Make enemies much larger - scale up significantly compared to player
          renderComponent.scale.set(0.05, 0.05, 0.05) // 5x larger than player scale
          renderComponent.matrixAutoUpdate = false
          renderComponent.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })
          this.scene.add(renderComponent)

          // Create mixer from the FBX model
          const mixer = new THREE.AnimationMixer(renderComponent)
          const animations = new Map<string, THREE.AnimationAction>()
          
          // Load idle animation from the base FBX file
          if (fbx.animations && fbx.animations.length > 0) {
            const clip = fbx.animations[0]
            const action = mixer.clipAction(clip)
            action.setLoop(THREE.LoopRepeat, Infinity)
            action.enabled = true // Start with idle
            action.setEffectiveWeight(1.0)
            action.play()
            animations.set(ENEMY_STATES.IDLE, action)
            console.log('Loaded IDLE animation for enemy from Standing Idle.fbx')
          }
          
          // Load Shooting Gun.fbx animation
          fbxLoader.load(
            '/games/squid-game/assets/Shooting Gun.fbx',
            (shootFbx) => {
              if (shootFbx.animations && shootFbx.animations.length > 0) {
                const clip = shootFbx.animations[0]
                try {
                  const action = mixer.clipAction(clip, renderComponent)
                  action.setLoop(THREE.LoopOnce, 1)
                  action.enabled = false
                  action.setEffectiveWeight(0)
                  action.clampWhenFinished = true
                  animations.set(ENEMY_STATES.SHOOTING, action)
                  console.log('Loaded SHOOTING animation for enemy from Shooting Gun.fbx')
                } catch (error) {
                  console.warn('Failed to apply shooting animation to enemy:', error)
                }
              }
              
              // Create enemy entity
              const enemy = new YUKA.GameEntity() as EnemyEntity
              enemy.mixer = mixer
              enemy.animations = animations
              enemy.position.set(x, y, z)
              enemy.name = 'enemy'
              ;(enemy as any)._renderComponent = renderComponent
              
              // Set initial render component position
              renderComponent.position.set(x, y, z)
              // Make enemy look at the starting area (where players are)
              renderComponent.lookAt(0, 0, 50)
              renderComponent.updateMatrix()
              
              // Setup enemy state machine
              this.setupEnemyStateMachine(enemy)
              
              this.entityManager.add(enemy)
              this.enemies.push(enemy)
              resolve()
            },
            undefined,
            (error) => {
              console.warn('Failed to load Shooting Gun.fbx for enemy:', error)
              // Continue without shooting animation
              const enemy = new YUKA.GameEntity() as EnemyEntity
              enemy.mixer = mixer
              enemy.animations = animations
              enemy.position.set(x, y, z)
              enemy.name = 'enemy'
              ;(enemy as any)._renderComponent = renderComponent
              
              renderComponent.position.set(x, y, z)
              renderComponent.lookAt(0, 0, 50)
              renderComponent.updateMatrix()
              
              this.setupEnemyStateMachine(enemy)
              this.entityManager.add(enemy)
              this.enemies.push(enemy)
              resolve()
            }
          )
        },
        undefined,
        reject
      )
    })
  }

  setupEnemyStateMachine(enemy: EnemyEntity): void {
    enemy.stateMachine = new YUKA.StateMachine(enemy)

    // Idle State
    const idleState = new YUKA.State()
    idleState.id = ENEMY_STATES.IDLE
    idleState.enter = () => {
      const idle = enemy.animations.get(ENEMY_STATES.IDLE)
      const shooting = enemy.animations.get(ENEMY_STATES.SHOOTING)
      
      if (idle) {
        idle.enabled = true
        idle.setEffectiveWeight(1.0)
        idle.play()
      }
      
      if (shooting) {
        shooting.enabled = false
        shooting.setEffectiveWeight(0)
      }
    }
    enemy.stateMachine.add(ENEMY_STATES.IDLE, idleState)

    // Shooting State
    const shootingState = new YUKA.State()
    shootingState.id = ENEMY_STATES.SHOOTING
    shootingState.enter = () => {
      const shooting = enemy.animations.get(ENEMY_STATES.SHOOTING)
      const idle = enemy.animations.get(ENEMY_STATES.IDLE)
      
      // Make enemy look at players
      const renderComponent = (enemy as any)._renderComponent
      if (renderComponent) {
        renderComponent.lookAt(0, 0, 50)
        renderComponent.updateMatrix()
      }
      
      if (shooting) {
        shooting.reset()
        shooting.enabled = true
        shooting.setEffectiveWeight(1.0)
        shooting.play()
        
        // After shooting animation, return to idle
        const onFinished = () => {
          if (enemy.stateMachine) {
            enemy.stateMachine.changeTo(ENEMY_STATES.IDLE)
          }
          shooting.getMixer().removeEventListener('finished', onFinished)
        }
        shooting.getMixer().addEventListener('finished', onFinished)
      }
      
      if (idle) {
        idle.enabled = false
        idle.setEffectiveWeight(0)
      }
    }
    enemy.stateMachine.add(ENEMY_STATES.SHOOTING, shootingState)

    // Start in idle state
    enemy.stateMachine.changeTo(ENEMY_STATES.IDLE)
  }

  async addNpcPlayers(): Promise<void> {
    const promises = []
    for (let i = 0; i < 100; i++) {
      promises.push(this.addNpcPlayer())
    }
    await Promise.all(promises)
  }

  async addNpcPlayer(): Promise<void> {
    if (!this.player._renderComponent) return

    const renderComponent = this.player._renderComponent.clone()
    renderComponent.matrixAutoUpdate = false
    this.scene.add(renderComponent)

    const mixer = new THREE.AnimationMixer(renderComponent)
    const animations = new Map<string, THREE.AnimationAction>()
    
    // Clone animations from player
    this.player.animations.forEach((action, state) => {
      if (state !== PLAYER_STATES.DEAD) {
        const clip = action.getClip().clone()
        const newAction = mixer.clipAction(clip)
        newAction.play()
        newAction.enabled = false
        animations.set(state, newAction)
      }
    })

    const npcX = Math.random() * 28 - 14
    const npcZ = Math.random() * 3 + 47
    
    const npcPlayer = new YUKA.Vehicle() as any
    npcPlayer.mixer = mixer
    npcPlayer.animations = animations
    npcPlayer.npc = true
    npcPlayer.position.set(npcX, 0, npcZ)
    npcPlayer.maxSpeed = Math.random() * 3 + 3
    npcPlayer.updateOrientation = true
    npcPlayer._renderComponent = renderComponent

    // Set initial render component position
    renderComponent.position.set(npcX, 0, npcZ)
    renderComponent.lookAt(0, 0, -52) // Look toward finish line
    renderComponent.updateMatrix()

    // Setup state machine
    npcPlayer.stateMachine = new YUKA.StateMachine(npcPlayer)
    this.setupPlayerStateMachine(npcPlayer)
    npcPlayer.stateMachine.changeTo(PLAYER_STATES.IDLE)

    // Setup behavior (smart NPC that moves during green light)
    const target = new YUKA.Vector3(npcPlayer.position.x, npcPlayer.position.y, -45)
    const seekBehavior = new YUKA.SeekBehavior(target)
    seekBehavior.active = false
    npcPlayer.steering.add(seekBehavior)
    npcPlayer.behavior = seekBehavior

    this.entityManager.add(npcPlayer)
  }

  async addWalls(): Promise<void> {
    const wallTexture = new THREE.TextureLoader().load('/games/squid-game/assets/squid-textures/textures/walls_baseColor.png')
    const wallMaterial = new THREE.MeshLambertMaterial({ map: wallTexture })

    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 2), wallMaterial)
    frontWall.position.set(0, 5, -67)
    this.scene.add(frontWall)

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(150, 10, 2), wallMaterial)
    leftWall.position.set(-16, 5, 0)
    leftWall.rotateY(Math.PI / 2)
    this.scene.add(leftWall)

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(150, 10, 2), wallMaterial)
    rightWall.position.set(16, 5, 0)
    rightWall.rotateY(Math.PI / 2)
    this.scene.add(rightWall)

    // Finish line
    const material = new THREE.LineBasicMaterial({ color: 'red', linewidth: 10 })
    const points = [
      new THREE.Vector3(-20, 0, -44),
      new THREE.Vector3(0, 0, -44),
      new THREE.Vector3(20, 0, -44),
    ]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, material)
    this.scene.add(line)
  }

  async addTree(): Promise<void> {
    const loader = new GLTFLoader()
    
    return new Promise((resolve) => {
      loader.load(
        '/games/squid-game/assets/low_poly_dead_tree/scene.gltf',
        (gltf) => {
          const tree = gltf.scene
          tree.scale.set(10, 10, 10)
          tree.position.set(0, 0, -60)
          tree.traverse((child) => {
            child.castShadow = false
            child.receiveShadow = false
          })
          this.scene.add(tree)
          resolve()
        },
        undefined,
        () => resolve() // Resolve even on error
      )
    })
  }

  addTriggers(): void {
    const size = new YUKA.Vector3(50, 5, 10)
    const rectangularTriggerRegion = new YUKA.RectangularTriggerRegion(size)
    const finishLineTrigger = new YUKA.Trigger(rectangularTriggerRegion)
    finishLineTrigger.position.set(0, 0, -50)
    
    finishLineTrigger.onTriggerEnter = (entity: YUKA.GameEntity) => {
      if (entity === this.player) {
        // Check if player has answered all 20 questions correctly
        if (this.correctAnswers >= this.totalQuestions) {
          this.player.stateMachine.changeTo(PLAYER_STATES.DANCE)
          this.setState({ isGameOver: true, score: 1000 })
          this.gameStarted = false
          if (this.timerInterval) clearInterval(this.timerInterval)
        } else {
          // Player hasn't answered enough questions - don't let them win
          // Could show a message or push them back
        }
      }
    }
    
    this.entityManager.add(finishLineTrigger)
  }

  startGameLogic(): void {
    this.gameStarted = true
    this.startTimer()
    
    // Activate NPC behaviors
    this.entityManager.entities
      .filter((entity: any): entity is PlayerEntity => 
        entity.behavior && entity.npc
      )
      .forEach((entity: any) => {
        if (entity.behavior) {
          entity.behavior.active = true
          entity.stateMachine.changeTo(PLAYER_STATES.RUN)
        }
      })
  }

  startTimer(): void {
    let timer = 59
    this.doll.stateMachine.changeTo(DOLL_STATES.GREEN_LIGHT)
    this.doll.timer = timer
    // Track state change timing using seconds (simpler and more reliable)
    let stateChangeCounter = 0
    let nextStateChangeDelay = 3 + Math.floor(Math.random() * 3) // Random 3-5 seconds

    this.timerInterval = setInterval(() => {
      timer--
      this.doll.timer = timer
      stateChangeCounter++
      
      // Random timing for doll state changes (makes game more fun and unpredictable)
      const currentDollState = this.doll.stateMachine.currentState?.id
      
      // Randomly switch states based on counter
      if (stateChangeCounter >= nextStateChangeDelay) {
        if (currentDollState === DOLL_STATES.GREEN_LIGHT) {
          this.doll.stateMachine.changeTo(DOLL_STATES.RED_LIGHT)
          stateChangeCounter = 0
          // Random delay for next state change (2-5 seconds)
          nextStateChangeDelay = 2 + Math.floor(Math.random() * 4)
        } else if (currentDollState === DOLL_STATES.RED_LIGHT) {
          this.doll.stateMachine.changeTo(DOLL_STATES.GREEN_LIGHT)
          stateChangeCounter = 0
          // Random delay for next state change (3-6 seconds)
          nextStateChangeDelay = 3 + Math.floor(Math.random() * 4)
        }
      }
      
      if (timer < 0) {
        this.doll.stateMachine.changeTo(DOLL_STATES.ELIMINATE_ALL)
        clearInterval(this.timerInterval)
        this.gameStarted = false
        this.setState({ isGameOver: true })
      }
    }, 1000)
  }

  update(deltaTime: number): void {
    if (!this.assetsLoaded || !this.gameStarted) {
      return
    }

    // Convert milliseconds to seconds
    // Cap at 1/20s (50ms) to prevent large jumps while allowing smooth 60 FPS
    const rawDelta = deltaTime / 1000
    const delta = Math.min(rawDelta, 1 / 20) // Cap at 20 FPS minimum for smoother animations
    
    // Update controls (sets velocity)
    if (this.controls && this.player) {
      this.updateControls(delta)
    }

    // Update player state machine and mixer
    if (this.player) {
      this.player.stateMachine.update()
      if (this.player.mixer) {
        this.player.mixer.update(delta)
      }
      // Manually update player position based on velocity
      if (this.player.velocity) {
        this.player.position.x += this.player.velocity.x * delta
        this.player.position.y += this.player.velocity.y * delta
        this.player.position.z += this.player.velocity.z * delta
      }
    }

    // Update doll state machine and mixer
    // State changes now happen in timer interval with random timing
    if (this.doll) {
      this.doll.stateMachine.update()
      if (this.doll.mixer) {
        this.doll.mixer.update(delta)
      }
    }

    // Update enemies state machines and mixers
    this.enemies.forEach((enemy) => {
      if (enemy.stateMachine) {
        enemy.stateMachine.update()
      }
      if (enemy.mixer) {
        enemy.mixer.update(delta)
      }
    })

    // Update other entities (NPCs, triggers, etc.)
    this.entityManager.update(delta)

    // Restrict player movement after position update
    if (this.player) {
      const fieldXHalfSize = 30 / 2
      const fieldZHalfSize = 100 / 2
      this.player.position.x = Math.max(
        -(fieldXHalfSize - 0.6),
        Math.min(fieldXHalfSize - 0.6, this.player.position.x)
      )
      this.player.position.z = Math.max(
        -(fieldZHalfSize - 0.6),
        Math.min(fieldZHalfSize - 0.6, this.player.position.z)
      )
    }

    // State changes are now handled in startTimer() interval
    // This ensures proper timing and prevents conflicts

    // Sync render components with entities (optimized - only update if needed)
    const entities = this.entityManager.entities
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i] as any
      const renderComponent = entity._renderComponent
      
      // Skip player and enemies - they're synced separately below
      if (entity === this.player || this.enemies.includes(entity)) {
        continue
      }
      
      if (renderComponent) {
        if (entity.worldMatrix) {
          renderComponent.matrix.copy(entity.worldMatrix)
          renderComponent.matrixAutoUpdate = false
        } else {
          // Fallback: update position directly for NPCs and other entities
          renderComponent.position.set(
            entity.position.x,
            entity.position.y,
            entity.position.z
          )
          renderComponent.updateMatrix()
        }
      }
    }
    
    // Also sync player render component
    if (this.player && this.player._renderComponent) {
      const renderComponent = this.player._renderComponent
      if (this.player.worldMatrix) {
        renderComponent.matrix.copy(this.player.worldMatrix)
        renderComponent.matrixAutoUpdate = false
      } else {
        // Fallback: update position directly if worldMatrix not available
        renderComponent.position.set(
          this.player.position.x,
          this.player.position.y,
          this.player.position.z
        )
        renderComponent.updateMatrix()
      }
    }

    // Sync enemy render components
    this.enemies.forEach((enemy) => {
      const renderComponent = (enemy as any)._renderComponent
      if (renderComponent) {
        if (enemy.worldMatrix) {
          renderComponent.matrix.copy(enemy.worldMatrix)
          renderComponent.matrixAutoUpdate = false
        } else {
          // Fallback: update position directly
          renderComponent.position.set(
            enemy.position.x,
            enemy.position.y,
            enemy.position.z
          )
          renderComponent.updateMatrix()
        }
      }
    })

    // Update doll scale based on player distance for perspective effect
    if (this.doll && this.doll._renderComponent && this.player) {
      const dollRenderComponent = (this.doll as any)._renderComponent
      const playerPos = this.player.position
      const dollPos = (this.doll as any).position
      
      // Calculate distance between player and doll
      const dx = playerPos.x - dollPos.x
      const dy = playerPos.y - dollPos.y
      const dz = playerPos.z - dollPos.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      
      // Base scale is 6, increase as player gets closer
      // When player is at start (z=50), doll is at z=-52, distance ~102
      // When player reaches doll (z=-52), distance ~0
      // Scale inversely proportional to distance for perspective effect
      const maxDistance = 102 // Starting distance
      const minDistance = 5 // Minimum distance
      const baseScale = 6
      const maxScale = 12 // Maximum scale when very close
      
      // Clamp distance to prevent extreme scaling
      const clampedDistance = Math.max(minDistance, Math.min(distance, maxDistance))
      
      // Calculate scale: larger when closer (inverse relationship)
      // Scale from maxScale (close) to baseScale (far)
      const scaleFactor = baseScale + (maxScale - baseScale) * (1 - (clampedDistance - minDistance) / (maxDistance - minDistance))
      
      dollRenderComponent.scale.set(scaleFactor, scaleFactor, scaleFactor)
    }
  }

  updateControls(delta: number): void {
    const { input } = this.controls
    const player = this.player as any
    player.input = input
    
    const currentStateId = player.stateMachine.currentState?.id
    const dollState = this.doll?.stateMachine?.currentState?.id

    // Prevent movement during red light/question overlay
    // During red light, player must freeze (statue) or they will be killed
    if (this.showQuestionOverlay || dollState === DOLL_STATES.RED_LIGHT) {
      if (player.velocity) {
        player.velocity.x = 0
        player.velocity.y = 0
        player.velocity.z = 0
      }
      // Force player to idle state during red light (unless answering question)
      if (!this.showQuestionOverlay && currentStateId !== PLAYER_STATES.IDLE && currentStateId !== PLAYER_STATES.DEAD) {
        player.stateMachine.changeTo(PLAYER_STATES.IDLE)
      }
      return
    }

    if (currentStateId !== PLAYER_STATES.DANCE && currentStateId !== PLAYER_STATES.DEAD) {
      player.maxSpeed = input.shift ? 4 : 2

      const direction = new YUKA.Vector3()
      direction.z = Number(input.backward) - Number(input.forward)
      direction.x = Number(input.right) - Number(input.left)
      direction.normalize()

      if (direction.squaredLength() === 0) {
        // Brake
        if (player.velocity) {
          player.velocity.x -= player.velocity.x * this.controls.brakingForce * delta
          player.velocity.z -= player.velocity.z * this.controls.brakingForce * delta
        }
      } else {
        // Set velocity to direction scaled by maxSpeed
        // Use add() method like original (direction is already normalized)
        if (!player.velocity) {
          player.velocity = new YUKA.Vector3()
        }
        // Calculate target velocity
        const targetVelocity = new YUKA.Vector3(
          direction.x * player.maxSpeed,
          direction.y * player.maxSpeed,
          direction.z * player.maxSpeed
        )
        // Set velocity directly (original uses add, but we'll set for consistency)
        player.velocity.x = targetVelocity.x
        player.velocity.y = targetVelocity.y
        player.velocity.z = targetVelocity.z
      }

      // Update camera
      const offsetX = this.camera.position.x - this.controls.cameraOffset.x - player.position.x
      const offsetZ = this.camera.position.z - this.controls.cameraOffset.z - player.position.z

      if (offsetX !== 0) {
        this.camera.position.x -= offsetX * delta * this.controls.cameraMovementSpeed
      }
      if (offsetZ !== 0) {
        this.camera.position.z -= offsetZ * delta * this.controls.cameraMovementSpeed
      }
    }

    if (currentStateId === PLAYER_STATES.DANCE && this.camera.position.z !== 0) {
      this.camera.position.z = 0
    }
  }

  render(ctx: CanvasRenderingContext2D | null): void {
    if (!this.assetsLoaded) {
      if (ctx) {
        this.renderLoadingScreen(ctx)
      }
      return
    }

    // Render Three.js scene with optimizations
    // Use renderer's built-in optimizations for 60 FPS
    this.renderer.render(this.scene, this.camera)

    // Render UI overlay
    if (ctx) {
      if (!this.gameStarted && !this.state.isGameOver) {
        this.renderStartScreen(ctx)
      } else if (this.gameStarted) {
        this.renderGameUI(ctx)
      } else if (this.state.isGameOver) {
        this.renderGameOver(ctx)
      }
    }
  }

  renderLoadingScreen(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.fillStyle = '#ff0000'
    ctx.font = 'bold 48px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('SQUID GAME', this.width / 2, this.height / 2 - 100)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px monospace'
    ctx.fillText(this.loadingMessage, this.width / 2, this.height / 2)
    ctx.fillText(`${this.loadingProgress}%`, this.width / 2, this.height / 2 + 40)
  }

  renderStartScreen(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.fillStyle = '#ff0000'
    ctx.font = 'bold 64px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('RED LIGHT', this.width / 2, this.height / 2 - 100)
    ctx.fillStyle = '#00ff00'
    ctx.fillText('GREEN LIGHT', this.width / 2, this.height / 2 - 40)

    ctx.fillStyle = '#ffffff'
    ctx.font = '24px monospace'
    ctx.fillText('Press SPACE or ENTER to Start', this.width / 2, this.height / 2 + 40)
    ctx.fillText('WASD or Arrow Keys to Move', this.width / 2, this.height / 2 + 80)
    ctx.fillText('Hold SHIFT to Run', this.width / 2, this.height / 2 + 120)
  }

  renderGameUI(ctx: CanvasRenderingContext2D): void {
    // Timer
    const minutes = Math.floor((this.doll.timer || 0) / 60)
    const seconds = (this.doll.timer || 0) % 60
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(this.width / 2 - 80, 20, 160, 60)
    ctx.fillStyle = '#ff0000'
    ctx.font = 'bold 32px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(timeStr, this.width / 2, 60)

    // Light status
    const currentState = this.doll.stateMachine.currentState?.id
    const lightStatus = currentState === DOLL_STATES.GREEN_LIGHT ? 'GREEN LIGHT' : 'RED LIGHT'
    const lightColor = currentState === DOLL_STATES.GREEN_LIGHT ? '#00ff00' : '#ff0000'
    
    ctx.fillStyle = lightColor
    ctx.font = 'bold 24px monospace'
    ctx.fillText(lightStatus, this.width / 2, 100)

    // Question progress
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(20, this.height - 100, 300, 80)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`Correct: ${this.correctAnswers}/${this.totalQuestions}`, 30, this.height - 70)
    ctx.fillText(`Wrong: ${this.wrongAnswers}/${this.maxWrongAnswers}`, 30, this.height - 40)

    // Question overlay during red light
    if (this.showQuestionOverlay && this.currentQuestion) {
      this.renderQuestionOverlay(ctx)
    }
  }

  renderQuestionOverlay(ctx: CanvasRenderingContext2D): void {
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, this.width, this.height)

    // Question box
    const boxWidth = 800
    const boxHeight = 500
    const boxX = (this.width - boxWidth) / 2
    const boxY = (this.height - boxHeight) / 2

    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
    
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 4
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

    // Question text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('RED LIGHT - ANSWER THE QUESTION', this.width / 2, boxY + 60)
    
    ctx.fillStyle = '#ff0000'
    ctx.font = 'bold 28px monospace'
    ctx.fillText(this.currentQuestion.question, this.width / 2, boxY + 120)

    // Options
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px monospace'
    const optionLabels = ['1', '2', '3', '4']
    const optionYStart = boxY + 180
    const optionSpacing = 70

    this.currentQuestion.options.forEach((option: string, index: number) => {
      const optionY = optionYStart + index * optionSpacing
      const optionBoxX = boxX + 50
      const optionBoxY = optionY - 25
      const optionBoxWidth = boxWidth - 100
      const optionBoxHeight = 50

      // Option box background
      ctx.fillStyle = '#2a2a2a'
      ctx.fillRect(optionBoxX, optionBoxY, optionBoxWidth, optionBoxHeight)
      
      ctx.strokeStyle = '#666666'
      ctx.lineWidth = 2
      ctx.strokeRect(optionBoxX, optionBoxY, optionBoxWidth, optionBoxHeight)

      // Option text
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.fillText(`${optionLabels[index]}. ${option}`, optionBoxX + 20, optionY + 5)
    })

    // Instructions
    ctx.fillStyle = '#888888'
    ctx.font = '20px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Press 1, 2, 3, or 4 to select your answer', this.width / 2, boxY + boxHeight - 40)
  }

  renderGameOver(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(0, 0, this.width, this.height)

    const isVictory = this.player.stateMachine.currentState?.id === PLAYER_STATES.DANCE
    
    ctx.fillStyle = isVictory ? '#00ff00' : '#ff0000'
    ctx.font = 'bold 64px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(isVictory ? 'VICTORY!' : 'ELIMINATED!', this.width / 2, this.height / 2 - 40)

    ctx.fillStyle = '#ffffff'
    ctx.font = '24px monospace'
    ctx.fillText('Press R to Restart', this.width / 2, this.height / 2 + 40)
  }

  handleInput(key: string): void {
    const keyCode = key.toUpperCase()

    // Start game
    if ((key === ' ' || key === 'Enter') && !this.gameStarted && !this.state.isGameOver) {
      this.setState({ isGameStarted: true })
      this.startGameLogic()
      return
    }

    // Restart
    if (keyCode === 'R' && this.state.isGameOver) {
      window.location.reload()
      return
    }

    if (!this.gameStarted) return

    // Handle question answers during red light
    if (this.showQuestionOverlay && this.currentQuestion) {
      if (keyCode === '1' || keyCode === 'DIGIT1') {
        this.handleQuestionAnswer(0)
        return
      } else if (keyCode === '2' || keyCode === 'DIGIT2') {
        this.handleQuestionAnswer(1)
        return
      } else if (keyCode === '3' || keyCode === 'DIGIT3') {
        this.handleQuestionAnswer(2)
        return
      } else if (keyCode === '4' || keyCode === 'DIGIT4') {
        this.handleQuestionAnswer(3)
        return
      }
      // Don't allow movement during question overlay
      return
    }

    // Prevent movement during red light (player must freeze/statue)
    const dollState = this.doll?.stateMachine?.currentState?.id
    if (dollState === DOLL_STATES.RED_LIGHT) {
      // During red light, player must freeze or they will be killed
      // Only allow input if answering question
      if (!this.showQuestionOverlay) {
        return
      }
    }

    // Movement controls (only allowed during green light)
    switch (keyCode) {
      case 'W':
        this.controls.input.forward = true
        break
      case 'ARROWUP':
        this.controls.input.forward = true
        this.controls.input.shift = true // Arrow keys make character run
        break
      case 'S':
        this.controls.input.backward = true
        break
      case 'ARROWDOWN':
        this.controls.input.backward = true
        this.controls.input.shift = true // Arrow keys make character run
        break
      case 'A':
        this.controls.input.left = true
        break
      case 'ARROWLEFT':
        this.controls.input.left = true
        this.controls.input.shift = true // Arrow keys make character run
        break
      case 'D':
        this.controls.input.right = true
        break
      case 'ARROWRIGHT':
        this.controls.input.right = true
        this.controls.input.shift = true // Arrow keys make character run
        break
      case 'SHIFT':
        this.controls.input.shift = true
        break
    }
  }

  handleKeyRelease(key: string): void {
    if (!this.gameStarted) return

    const keyCode = key.toUpperCase()
    
    switch (keyCode) {
      case 'W':
        this.controls.input.forward = false
        break
      case 'ARROWUP':
        this.controls.input.forward = false
        // Only disable shift if no other arrow keys are pressed
        if (!this.controls.input.backward && !this.controls.input.left && !this.controls.input.right) {
          this.controls.input.shift = false
        }
        break
      case 'S':
        this.controls.input.backward = false
        break
      case 'ARROWDOWN':
        this.controls.input.backward = false
        // Only disable shift if no other arrow keys are pressed
        if (!this.controls.input.forward && !this.controls.input.left && !this.controls.input.right) {
          this.controls.input.shift = false
        }
        break
      case 'A':
        this.controls.input.left = false
        break
      case 'ARROWLEFT':
        this.controls.input.left = false
        // Only disable shift if no other arrow keys are pressed
        if (!this.controls.input.forward && !this.controls.input.backward && !this.controls.input.right) {
          this.controls.input.shift = false
        }
        break
      case 'D':
        this.controls.input.right = false
        break
      case 'ARROWRIGHT':
        this.controls.input.right = false
        // Only disable shift if no other arrow keys are pressed
        if (!this.controls.input.forward && !this.controls.input.backward && !this.controls.input.left) {
          this.controls.input.shift = false
        }
        break
      case 'SHIFT':
        this.controls.input.shift = false
        break
    }
  }

  cleanup(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }

    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else if (object.material) {
            object.material.dispose()
          }
        }
      })
    }

    if (this.renderer) {
      this.renderer.dispose()
    }
  }
}

