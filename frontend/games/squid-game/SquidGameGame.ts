import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BaseGame } from '../BaseGame'

interface Question {
  id: string
  text: string
  options: string[]
  correctOptionIndex: number
}

interface GameConfig {
  topic: string
  questions: Question[]
  text: {
    title: string
    instructions: string
    gameOverTitle: string
    victoryTitle: string
    victoryMessage: string
    wrongAnswer: string
    caughtMoving: string
  }
  colorTheme: {
    background: string
    skyColor: string
    ground: string
    greenLight: string
    redLight: string
    [key: string]: string
  }
}

interface GameObjects {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls?: OrbitControls
  player?: THREE.Mesh | THREE.Group
  dog3?: THREE.Group
  dog3TargetRotation: number
  dog3CurrentRotation: number
  npc?: THREE.Group
  npcMixer?: THREE.AnimationMixer
  npcAction?: THREE.AnimationAction
  npcPosition: { x: number; z: number }
  npc2?: THREE.Group
  npc2Mixer?: THREE.AnimationMixer
  npc2Action?: THREE.AnimationAction
  npc2Position: { x: number; z: number }
  finish?: THREE.Mesh
  ground?: THREE.Mesh
}

/**
 * Squid Game - Red Light Green Light
 * Educational game with SAT questions integration
 * Built with Three.js for 3D graphics
 */
export class SquidGameGame extends BaseGame {
  private gameObjects: GameObjects | null = null
  private keysPressed: Set<string> = new Set()
  private assetsLoaded = false
  private loadingProgress = 0
  private loadingMessage = 'Initializing game...'
  private config: GameConfig | null = null
  private gameState: 'waiting' | 'green' | 'red' | 'question' | 'gameOver' | 'won' = 'waiting'
  private light: 'green' | 'red' = 'green'
  private moveSpeed = 0.3
  private groundMoveSpeed = 0.1
  private timeLeft = 90
  private currentQuestionIndex = 0
  private isMoving = false
  private timer: NodeJS.Timeout | null = null
  private lightChangeInterval: NodeJS.Timeout | null = null
  private rotationSpeed = 0.1
  private npc1Speed = 0.03
  private npc2Speed = 0.03
  private npcIsMoving = false
  private npc2IsMoving = false
  private targetRotation = 0

  init(): void {
    this.setState({
      score: 0,
      level: 1,
      lives: 1,
      isPaused: false,
      isGameOver: false,
      isGameStarted: false,
    })
    this.loadConfig()
  }

  private async loadConfig(): Promise<void> {
    // Use default config (no external config file needed)
    this.config = this.getDefaultConfig()
  }

  private getDefaultConfig(): GameConfig {
    return {
      topic: 'General Knowledge',
      questions: [
        {
          id: 'q1',
          text: 'What is the capital of France?',
          options: ['Paris', 'London', 'Berlin', 'Madrid'],
          correctOptionIndex: 0,
        },
      ],
      text: {
        title: 'Squid Game: Red Light, Green Light',
        instructions: 'Move when the light is green, stop when it\'s red!',
        gameOverTitle: 'ELIMINATED',
        victoryTitle: 'WINNER!',
        victoryMessage: 'Congratulations!',
        wrongAnswer: 'Wrong answer!',
        caughtMoving: 'You were caught moving!',
      },
      colorTheme: {
        background: '#1e1e1e',
        skyColor: '#87CEEB',
        ground: '#DAA520',
        greenLight: '#00FF00',
        redLight: '#FF0000',
      },
    }
  }

  async initializeThreeJS(canvas: HTMLCanvasElement): Promise<void> {
    if (this.gameObjects) return

    this.loadingProgress = 0
    this.loadingMessage = 'Creating 3D scene...'

    // Create scene
    const scene = new THREE.Scene()
    // Use a light blue sky color that's clearly visible
    scene.background = new THREE.Color(0x87CEEB) // Sky blue

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      0.1,
      1000
    )
    // Set initial camera position - behind player, looking forward
    // Position camera to see both player (at z=0) and doll (at z=250)
    camera.position.set(0, 8, 15) // Higher and further back for better view
    camera.lookAt(new THREE.Vector3(0, 0, 125)) // Look towards middle of track

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(this.width, this.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Add OrbitControls - disable for fixed camera view
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enabled = false // Disable orbit controls for fixed camera
    controls.target = new THREE.Vector3(0, 0, 125)

    // Lighting - make it brighter so objects are clearly visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)
    
    // Add a second light from the front for better visibility
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.5)
    frontLight.position.set(0, 5, 10)
    scene.add(frontLight)

    // Create ground
    this.loadingProgress = 20
    this.loadingMessage = 'Creating ground...'
    const groundGeometry = new THREE.PlaneGeometry(100, 1000)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: this.config?.colorTheme.ground || '#DAA520',
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.2,
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.5
    ground.receiveShadow = true
    scene.add(ground)

    // Create start and finish lines
    const startLine = new THREE.Mesh(
      new THREE.BoxGeometry(100, 0.1, 2),
      new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        metalness: 0.5,
        roughness: 0.5,
      })
    )
    startLine.position.set(0, -0.45, 0)
    startLine.receiveShadow = true
    scene.add(startLine)

    const finish = new THREE.Mesh(
      new THREE.BoxGeometry(100, 0.1, 2),
      new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        metalness: 0.5,
        roughness: 0.5,
      })
    )
    finish.position.set(0, -0.45, 245)
    finish.receiveShadow = true
    scene.add(finish)

    // Create player (simple placeholder)
    this.loadingProgress = 40
    this.loadingMessage = 'Setting up player...'
    this.createPlayer()

    // Create doll at finish line (placeholder)
    this.loadingProgress = 50
    this.loadingMessage = 'Setting up finish line...'
    this.createDoll()

    this.loadingProgress = 60
    this.loadingMessage = 'Loading NPCs...'
    await this.loadNPCs()

    this.loadingProgress = 80
    this.loadingMessage = 'Loading environment...'
    await this.loadEnvironment()

    this.loadingProgress = 100
    this.loadingMessage = 'Ready!'

    this.gameObjects = {
      scene,
      camera,
      renderer,
      controls,
      finish,
      ground,
      dog3TargetRotation: Math.PI,
      dog3CurrentRotation: Math.PI,
      npcPosition: { x: -5, z: 0 },
      npc2Position: { x: 5, z: 0 },
    }

    this.assetsLoaded = true
  }

  private createPlayer(): void {
    if (!this.gameObjects) return

    // Create simple player capsule - make it MUCH more visible and larger
    const geometry = new THREE.CapsuleGeometry(0.8, 2, 8, 16)
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    })
    const player = new THREE.Mesh(geometry, material)
    player.position.set(0, 1, 0) // Start position - at ground level
    player.castShadow = true
    this.gameObjects.player = player as any
    this.gameObjects.scene.add(player)
    
    // Add a tall pole above player to make it very visible
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8)
    const poleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.8
    })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.set(0, 2.5, 0)
    player.add(pole)
    
    // Add a bright sphere at the top
    const topGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const topMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 1.0
    })
    const top = new THREE.Mesh(topGeometry, topMaterial)
    top.position.set(0, 4, 0)
    player.add(top)
  }

  private createDoll(): void {
    if (!this.gameObjects) return

    // Create simple doll at finish line - make it MUCH more visible and larger
    const bodyGeometry = new THREE.CylinderGeometry(1.5, 1.5, 5, 16)
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.4
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.set(0, 2.5, 0) // Relative to group
    body.castShadow = true

    const headGeometry = new THREE.SphereGeometry(1.5, 16, 16)
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffcc99,
      emissive: 0xffcc99,
      emissiveIntensity: 0.3
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.set(0, 5.5, 0) // Relative to group
    head.castShadow = true

    // Create group for doll and position it at finish line
    const doll = new THREE.Group()
    doll.add(body)
    doll.add(head)
    doll.position.set(0, 0, 250) // At finish line, centered
    doll.rotation.y = Math.PI // Face towards start

    this.gameObjects.dog3 = doll
    this.gameObjects.scene.add(doll)

    // Add light indicator on doll (red/green light) - make it bigger and brighter
    const lightGeometry = new THREE.SphereGeometry(0.8, 16, 16)
    const lightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 1.5
    })
    const lightIndicator = new THREE.Mesh(lightGeometry, lightMaterial)
    lightIndicator.position.set(0, 7.5, 0) // Above head
    doll.add(lightIndicator)
    ;(this.gameObjects as any).lightIndicator = lightIndicator

    // Add tall pole behind doll for visibility
    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 10, 8)
    const poleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.2
    })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.set(0, 5, 0)
    doll.add(pole)

    // Add spotlight
    const spotlight = new THREE.SpotLight(0xffd700, 8)
    spotlight.position.set(0, 30, 245)
    spotlight.target.position.set(0, 0, 250)
    spotlight.angle = Math.PI / 6
    spotlight.penumbra = 0.1
    spotlight.castShadow = true
    this.gameObjects.scene.add(spotlight)
  }

  private async loadNPCs(): Promise<void> {
    if (!this.gameObjects) return

    // Load NPC 1 (Wolf)
    const loader1 = new GLTFLoader()
    try {
      const gltf1 = await new Promise<THREE.Object3D>((resolve, reject) => {
        loader1.load(
          '/games/squid-game/assets/wolf/scene.gltf',
          (gltf) => resolve(gltf.scene),
          undefined,
          reject
        )
      })

      const npc = gltf1 as THREE.Group
      npc.position.set(-5, 0, 0)
      npc.scale.set(3, 3, 3)
      npc.rotation.y = 0

      npc.traverse((node) => {
        if (node instanceof THREE.Mesh && node.material) {
          const material = node.material as THREE.MeshStandardMaterial
          material.color.setHex(0x444444)
          material.emissive = new THREE.Color(0x330000)
        }
      })

      const mixer = new THREE.AnimationMixer(npc)
      const animations = (gltf1 as any).animations || []
      let action: THREE.AnimationAction | undefined

      if (animations.length > 0) {
        action = mixer.clipAction(animations[0])
        action.timeScale = 1.2
        action.play()
        action.paused = true
      }

      this.gameObjects.npc = npc
      this.gameObjects.npcMixer = mixer
      this.gameObjects.npcAction = action
      this.gameObjects.scene.add(npc)
    } catch (error) {
      console.warn('Failed to load NPC 1:', error)
    }

    // Load NPC 2
    const loader2 = new GLTFLoader()
    try {
      const gltf2 = await new Promise<THREE.Object3D>((resolve, reject) => {
        loader2.load(
          '/games/squid-game/assets/npc2/scene.gltf',
          (gltf) => resolve(gltf.scene),
          undefined,
          reject
        )
      })

      const npc2 = gltf2 as THREE.Group
      npc2.position.set(5, 0, 0)
      npc2.scale.set(2, 2, 2)
      npc2.rotation.y = 0

      const mixer2 = new THREE.AnimationMixer(npc2)
      const animations = (gltf2 as any).animations || []
      let action2: THREE.AnimationAction | undefined

      if (animations.length > 0) {
        action2 = mixer2.clipAction(animations[0])
        action2.timeScale = 0.5
        action2.play()
        action2.paused = true
      }

      this.gameObjects.npc2 = npc2
      this.gameObjects.npc2Mixer = mixer2
      this.gameObjects.npc2Action = action2
      this.gameObjects.scene.add(npc2)
    } catch (error) {
      console.warn('Failed to load NPC 2:', error)
    }
  }

  private async loadEnvironment(): Promise<void> {
    if (!this.gameObjects) return

    // Load tree
    const loader = new GLTFLoader()
    try {
      const gltf = await new Promise<THREE.Object3D>((resolve, reject) => {
        loader.load(
          '/games/squid-game/assets/tree/scene.gltf',
          (gltf) => resolve(gltf.scene),
          undefined,
          reject
        )
      })

      const tree = gltf as THREE.Group
      tree.position.set(0, 45, 0)
      tree.scale.set(40, 40, 40)
      tree.rotation.y = 0

      tree.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.castShadow = true
          node.receiveShadow = true
          if (node.material) {
            const material = node.material as THREE.MeshStandardMaterial
            material.color = new THREE.Color(0x000000)
          }
        }
      })

      this.gameObjects.scene.add(tree)
    } catch (error) {
      console.warn('Failed to load tree:', error)
    }
  }

  update(deltaTime: number): void {
    if (
      !this.gameObjects ||
      !this.assetsLoaded ||
      this.state.isPaused ||
      this.state.isGameOver ||
      !this.state.isGameStarted
    ) {
      return
    }

    // Update animations
    if (this.gameObjects.npcMixer) {
      this.gameObjects.npcMixer.update(deltaTime)
    }
    if (this.gameObjects.npc2Mixer) {
      this.gameObjects.npc2Mixer.update(deltaTime)
    }

    // Update controls
    if (this.gameObjects.controls) {
      this.gameObjects.controls.update()
    }

    // Update doll rotation and light indicator
    this.updateDog3Rotation()

    // Move player (this also checks for red light violations)
    this.movePlayer(deltaTime)

    // Move NPCs
    this.moveNPCs(deltaTime)
  }

  private updateDog3Rotation(): void {
    if (!this.gameObjects?.dog3) return

    // Doll rotates to face players during red light
    const newTargetRotation = this.light === 'red' ? 0 : Math.PI // Face start during red, face away during green
    if (Math.abs(newTargetRotation - this.gameObjects.dog3TargetRotation) > 0.01) {
      this.gameObjects.dog3TargetRotation = newTargetRotation
    }

    const rotationDiff =
      this.gameObjects.dog3TargetRotation - this.gameObjects.dog3CurrentRotation
    if (Math.abs(rotationDiff) > 0.01) {
      this.gameObjects.dog3CurrentRotation += rotationDiff * this.rotationSpeed
      this.gameObjects.dog3.rotation.y = this.gameObjects.dog3CurrentRotation
    }

    // Update light indicator color
    const lightIndicator = (this.gameObjects as any).lightIndicator
    if (lightIndicator) {
      const material = lightIndicator.material as THREE.MeshStandardMaterial
      const color = this.light === 'green' ? 0x00ff00 : 0xff0000
      material.color.setHex(color)
      material.emissive.setHex(color)
    }
  }

  private movePlayer(deltaTime: number): void {
    if (!this.gameObjects?.player) return

    // Check if player is trying to move
    let moveX = 0
    let moveZ = 0
    const wasMoving = this.isMoving
    this.isMoving = false

    if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) {
      moveZ = this.moveSpeed
      this.isMoving = true
    }
    if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) {
      moveZ = -this.moveSpeed
      this.isMoving = true
    }
    if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) {
      moveX = -this.moveSpeed
      this.isMoving = true
    }
    if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) {
      moveX = this.moveSpeed
      this.isMoving = true
    }

    // CRITICAL: Check if player moved during red light
    if (this.gameState === 'red' && this.isMoving) {
      // Player moved during red light - ELIMINATE!
      this.setState({ isGameOver: true })
      this.gameState = 'gameOver'
      if (this.timer) clearInterval(this.timer)
      if (this.lightChangeInterval) clearInterval(this.lightChangeInterval)
      return
    }

    // Only allow movement during green light
    if (this.gameState !== 'green') {
      this.isMoving = false
      return
    }

    // Rotate player
    if (this.isMoving && this.gameObjects.player) {
      this.targetRotation = Math.atan2(-moveX, moveZ)
      this.gameObjects.player.rotation.y = this.targetRotation
    }

    // Move scene objects (ground movement effect) - player stays in place, world moves
    if (this.isMoving) {
      this.gameObjects.scene.children.forEach((child) => {
        if (child !== this.gameObjects.player && child !== this.gameObjects.dog3) {
          child.position.x += moveX * this.groundMoveSpeed
          child.position.z -= moveZ * this.groundMoveSpeed
        }
      })
    }

    // Check finish line - calculate distance traveled
    const virtualZ = -this.gameObjects.scene.children[0]?.position.z || 0
    if (virtualZ >= 245) {
      this.gameState = 'won'
      this.setState({ isGameOver: true, score: this.state.score + 1000 })
      if (this.timer) clearInterval(this.timer)
      if (this.lightChangeInterval) clearInterval(this.lightChangeInterval)
    }

    // Update camera to follow player progress (smoothly)
    if (this.gameObjects.camera) {
      const progress = Math.min(virtualZ / 245, 1) // 0 to 1
      // Camera stays at fixed position, looking down the track
      this.gameObjects.camera.position.x = 0
      this.gameObjects.camera.position.y = 8 // Keep height constant
      this.gameObjects.camera.position.z = 15 + progress * 235 // Follow player forward
      // Look ahead towards finish line
      const lookAtZ = 125 + progress * 120
      this.gameObjects.camera.lookAt(new THREE.Vector3(0, 0, lookAtZ))
    }
  }

  private moveNPCs(deltaTime: number): void {
    if (!this.gameObjects) return

    // Move NPC 1
    if (this.gameObjects.npc && this.light === 'green' && this.gameState === 'green') {
      if (this.gameObjects.npcPosition.z < 245) {
        if (!this.npcIsMoving) {
          this.npcIsMoving = true
          if (this.gameObjects.npcAction) {
            this.gameObjects.npcAction.paused = false
          }
        }
        this.gameObjects.npcPosition.z += this.npc1Speed
        this.gameObjects.npc.position.z = this.gameObjects.npcPosition.z
      } else {
        this.npcIsMoving = false
        if (this.gameObjects.npcAction) {
          this.gameObjects.npcAction.paused = true
        }
      }
    } else {
      this.npcIsMoving = false
      if (this.gameObjects.npcAction) {
        this.gameObjects.npcAction.paused = true
      }
    }

    // Move NPC 2
    if (this.gameObjects.npc2 && this.light === 'green' && this.gameState === 'green') {
      if (this.gameObjects.npc2Position.z < 245) {
        if (!this.npc2IsMoving) {
          this.npc2IsMoving = true
          if (this.gameObjects.npc2Action) {
            this.gameObjects.npc2Action.paused = false
          }
        }
        this.gameObjects.npc2Position.z += this.npc2Speed
        this.gameObjects.npc2.position.z = this.gameObjects.npc2Position.z
      } else {
        this.npc2IsMoving = false
        if (this.gameObjects.npc2Action) {
          this.gameObjects.npc2Action.paused = true
        }
      }
    } else {
      this.npc2IsMoving = false
      if (this.gameObjects.npc2Action) {
        this.gameObjects.npc2Action.paused = true
      }
    }
  }

  render(ctx: CanvasRenderingContext2D | null): void {
    // Show loading screen
    if (!this.gameObjects || !this.assetsLoaded) {
      if (ctx) {
        this.renderLoadingScreen(ctx)
      } else {
        // If no ctx, at least render the Three.js scene (even if empty)
        // This ensures something is visible
      }
      return
    }

    // Always render Three.js scene first
    this.gameObjects.renderer.render(this.gameObjects.scene, this.gameObjects.camera)

    // Then render UI overlays on top if we have a context
    if (ctx) {
      // Show start screen
      if (!this.state.isGameStarted) {
        this.renderStartScreen(ctx)
        return
      }

      // Draw UI overlay
      this.renderUI(ctx)

      // Show question if in question state
      if (this.gameState === 'question') {
        this.renderQuestion(ctx)
      }

      // Show game over
      if (this.state.isGameOver) {
        this.renderGameOver(ctx)
      }
    }
  }

  private renderUI(ctx: CanvasRenderingContext2D | null): void {
    if (!ctx) return
    const config = this.config || this.getDefaultConfig()

    // Game status
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(10, 10, 200, 80)

    ctx.fillStyle = this.light === 'green' ? config.colorTheme.greenLight : config.colorTheme.redLight
    ctx.font = 'bold 20px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(
      this.light === 'green' ? 'GREEN LIGHT' : 'RED LIGHT',
      20,
      40
    )

    ctx.fillStyle = '#fff'
    ctx.font = '16px monospace'
    ctx.fillText(`Time: ${this.timeLeft}`, 20, 65)
    ctx.fillText(`Score: ${this.state.score}`, 20, 85)
  }

  private renderQuestion(ctx: CanvasRenderingContext2D | null): void {
    if (!ctx || !this.config) return

    const question = this.config.questions[this.currentQuestionIndex]
    if (!question) return

    // Question overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(0, 0, this.width, this.height)

    // Question text
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 24px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(question.text, this.width / 2, this.height / 2 - 100)

    // Options
    const optionY = this.height / 2
    question.options.forEach((option, index) => {
      const y = optionY + index * 60
      ctx.fillStyle = 'rgba(60, 59, 110, 0.8)'
      ctx.fillRect(this.width / 2 - 200, y - 20, 400, 50)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.strokeRect(this.width / 2 - 200, y - 20, 400, 50)
      ctx.fillStyle = '#fff'
      ctx.font = '18px monospace'
      ctx.fillText(`${String.fromCharCode(65 + index)}. ${option}`, this.width / 2, y + 5)
    })

    ctx.textAlign = 'left'
  }

  private renderGameOver(ctx: CanvasRenderingContext2D | null): void {
    if (!ctx) return
    const config = this.config || this.getDefaultConfig()

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.fillStyle = '#ff0000'
    ctx.font = 'bold 48px monospace'
    ctx.textAlign = 'center'

    if (this.gameState === 'won') {
      ctx.fillStyle = '#00ff00'
      ctx.fillText('VICTORY!', this.width / 2, this.height / 2 - 40)
    } else {
      ctx.fillText('ELIMINATED!', this.width / 2, this.height / 2 - 40)
    }

    ctx.fillStyle = '#fff'
    ctx.font = '24px monospace'
    ctx.fillText(`Score: ${this.state.score}`, this.width / 2, this.height / 2 + 20)
    ctx.font = '20px monospace'
    ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 60)
    ctx.textAlign = 'left'
  }

  private renderStartScreen(ctx: CanvasRenderingContext2D | null): void {
    if (!ctx) return
    const config = this.config || this.getDefaultConfig()

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, this.width, this.height)

    // Title
    ctx.fillStyle = '#ff0000'
    ctx.font = 'bold 64px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('RED LIGHT', this.width / 2, this.height / 2 - 200)
    ctx.fillStyle = '#00ff00'
    ctx.fillText('GREEN LIGHT', this.width / 2, this.height / 2 - 140)

    // Instructions box
    const boxWidth = 800
    const boxHeight = 400
    const boxX = (this.width - boxWidth) / 2
    const boxY = this.height / 2 - 80

    ctx.fillStyle = 'rgba(20, 20, 20, 0.95)'
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px monospace'
    ctx.fillText('HOW TO PLAY', this.width / 2, boxY + 50)

    ctx.font = '20px monospace'
    ctx.textAlign = 'left'
    const instructions = [
      '• Move forward (W or ↑) when the light is GREEN',
      '• STOP immediately when the light turns RED',
      '• If you move during RED LIGHT, you are ELIMINATED!',
      '• Answer questions correctly to continue',
      '• Reach the finish line (245m) to survive',
      '',
      '🎯 This is a gamified SAT learning experience',
      '   Questions and challenges will be added soon!',
    ]

    instructions.forEach((line, index) => {
      ctx.fillStyle = line.startsWith('🎯') ? '#ffff00' : '#ffffff'
      ctx.fillText(line, boxX + 40, boxY + 100 + index * 35)
    })

    // Start button
    ctx.textAlign = 'center'
    const buttonY = boxY + boxHeight + 40
    const buttonWidth = 300
    const buttonHeight = 60
    const buttonX = this.width / 2 - buttonWidth / 2

    const pulse = Math.sin(Date.now() / 500) * 0.2 + 0.8
    ctx.fillStyle = `rgba(0, 255, 0, ${pulse})`
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight)
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 3
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight)

    ctx.fillStyle = '#000000'
    ctx.font = 'bold 28px monospace'
    ctx.fillText('PRESS SPACE OR ENTER TO START', this.width / 2, buttonY + 40)
  }

  private renderLoadingScreen(ctx: CanvasRenderingContext2D | null): void {
    if (!ctx) return
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.fillStyle = '#ff0000'
    ctx.font = 'bold 48px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('SQUID GAME', this.width / 2, this.height / 2 - 150)
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px monospace'
    ctx.fillText('Red Light Green Light', this.width / 2, this.height / 2 - 100)

    // Loading box
    const boxWidth = 600
    const boxHeight = 200
    const boxX = (this.width - boxWidth) / 2
    const boxY = this.height / 2 - 50

    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)'
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

    ctx.fillStyle = '#ffffff'
    ctx.font = '20px monospace'
    ctx.fillText(this.loadingMessage, this.width / 2, boxY + 50)

    // Progress bar
    const progressBarWidth = 500
    const progressBarHeight = 30
    const progressBarX = (this.width - progressBarWidth) / 2
    const progressBarY = boxY + 100

    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)'
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)

    const progressFillWidth = (progressBarWidth * this.loadingProgress) / 100
    ctx.fillStyle = this.loadingProgress < 100 ? '#ffff00' : '#00ff00'
    ctx.fillRect(progressBarX, progressBarY, progressFillWidth, progressBarHeight)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px monospace'
    ctx.fillText(`${this.loadingProgress}%`, this.width / 2, progressBarY + 55)
  }

  handleInput(key: string): void {
    const keyLower = key.toLowerCase()

    // Start game
    if (!this.state.isGameStarted && (key === ' ' || key === 'Enter')) {
      this.setState({ isGameStarted: true })
      this.startGame()
      return
    }

    // Restart
    if (keyLower === 'r' && this.state.isGameOver) {
      this.restartGame()
      return
    }

    if (this.state.isPaused || this.state.isGameOver || !this.state.isGameStarted) return

    // Movement detection during red light is handled in movePlayer() method
    // This ensures we catch movement even if keys are held from green light

    // Answer question (A, B, C, D or 1, 2, 3, 4)
    if (this.gameState === 'question') {
      const answerIndex =
        keyLower === 'a' || key === '1'
          ? 0
          : keyLower === 'b' || key === '2'
            ? 1
            : keyLower === 'c' || key === '3'
              ? 2
              : keyLower === 'd' || key === '4'
                ? 3
                : -1

      if (answerIndex >= 0 && this.config) {
        const question = this.config.questions[this.currentQuestionIndex]
        if (question) {
          this.checkAnswer(answerIndex, question.correctOptionIndex)
        }
      }
      return
    }

    // Track movement keys
    if (
      key === 'KeyW' ||
      key === 'ArrowUp' ||
      key === 'KeyS' ||
      key === 'ArrowDown' ||
      key === 'KeyA' ||
      key === 'ArrowLeft' ||
      key === 'KeyD' ||
      key === 'ArrowRight'
    ) {
      this.keysPressed.add(key)
    }
  }

  handleKeyRelease(key: string): void {
    if (
      key === 'KeyW' ||
      key === 'ArrowUp' ||
      key === 'KeyS' ||
      key === 'ArrowDown' ||
      key === 'KeyA' ||
      key === 'ArrowLeft' ||
      key === 'KeyD' ||
      key === 'ArrowRight'
    ) {
      this.keysPressed.delete(key)
    }
  }

  private startGame(): void {
    this.gameState = 'green'
    this.light = 'green'

    // Start timer
    this.timer = setInterval(() => {
      this.timeLeft--
      if (this.timeLeft <= 0) {
        if (this.timer) clearInterval(this.timer)
        if (this.lightChangeInterval) clearInterval(this.lightChangeInterval)
        this.setState({ isGameOver: true })
        this.gameState = 'gameOver'
      }
    }, 1000)

    // Start light changes
    this.startLightChanges()
  }

  private startLightChanges(): void {
    // Simple light change: green -> red -> green cycle
    this.lightChangeInterval = setInterval(() => {
      if (this.gameState === 'gameOver' || this.gameState === 'won') {
        return
      }

      if (this.light === 'green') {
        // Switch to red light after random duration (3-5 seconds)
        setTimeout(() => {
          if (this.gameState !== 'won' && this.gameState !== 'gameOver') {
            this.light = 'red'
            this.gameState = 'red'
            
            // Switch back to green after 2-4 seconds
            setTimeout(() => {
              if (this.gameState !== 'won' && this.gameState !== 'gameOver') {
                this.light = 'green'
                this.gameState = 'green'
              }
            }, Math.random() * 2000 + 2000)
          }
        }, Math.random() * 2000 + 3000)
      }
    }, Math.random() * 2000 + 3000)
  }

  private showQuestion(): void {
    if (!this.config || this.config.questions.length === 0) {
      // No questions, just continue
      this.light = 'green'
      this.gameState = 'green'
      return
    }

    this.gameState = 'question'
    if (this.currentQuestionIndex >= this.config.questions.length) {
      this.currentQuestionIndex = 0
    }
  }

  private checkAnswer(selectedIndex: number, correctIndex: number): void {
    if (selectedIndex === correctIndex) {
      // Correct
      this.setState({ score: this.state.score + 10 })
      this.currentQuestionIndex++
      this.light = 'green'
      this.gameState = 'green'
    } else {
      // Wrong
      this.setState({ isGameOver: true })
      this.gameState = 'gameOver'
      if (this.timer) clearInterval(this.timer)
      if (this.lightChangeInterval) clearInterval(this.lightChangeInterval)
    }
  }

  private restartGame(): void {
    if (this.timer) clearInterval(this.timer)
    if (this.lightChangeInterval) clearInterval(this.lightChangeInterval)

    this.timeLeft = 90
    this.currentQuestionIndex = 0
    this.gameState = 'waiting'
    this.light = 'green'
    this.isMoving = false
    this.keysPressed.clear()

    if (this.gameObjects) {
      // Reset player position
      if (this.gameObjects.player) {
        this.gameObjects.player.position.set(0, 0, 0)
        this.gameObjects.player.rotation.y = 0
      }

      // Reset NPCs
      this.gameObjects.npcPosition = { x: -5, z: 0 }
      this.gameObjects.npc2Position = { x: 5, z: 0 }
      if (this.gameObjects.npc) {
        this.gameObjects.npc.position.set(-5, 0, 0)
      }
      if (this.gameObjects.npc2) {
        this.gameObjects.npc2.position.set(5, 0, 0)
      }

      // Reset scene
      this.gameObjects.scene.children.forEach((child) => {
        if (child !== this.gameObjects.player) {
          child.position.x = 0
          child.position.z = 0
        }
      })
    }

    this.setState({
      isGameOver: false,
      isGameStarted: false,
      score: 0,
    })
  }

  cleanup(): void {
    if (this.timer) clearInterval(this.timer)
    if (this.lightChangeInterval) clearInterval(this.lightChangeInterval)

    if (this.gameObjects) {
      this.gameObjects.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })

      this.gameObjects.renderer.dispose()
      this.gameObjects = null
    }
    this.keysPressed.clear()
  }

  async setupThreeJS(canvas: HTMLCanvasElement): Promise<void> {
    await this.initializeThreeJS(canvas)
  }
}
