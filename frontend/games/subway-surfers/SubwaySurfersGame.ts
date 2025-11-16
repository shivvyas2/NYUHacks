import { BaseGame } from '../BaseGame'
import { QuestionsData } from '@/games/subway-surfers/types/game'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { AnimationMixer, AnimationAction } from 'three'

/**
 * Subway Surfers Game
 * Simple implementation that loads and displays the subway surfers GLTF model
 */
export class SubwaySurfersGame extends BaseGame {
  private static audioRegistry: Set<HTMLAudioElement> = new Set()
  private static registerAudio(el: HTMLAudioElement | null | undefined): void {
    if (!el) return
    SubwaySurfersGame.audioRegistry.add(el)
  }
  static stopAllAudio(): void {
    for (const a of SubwaySurfersGame.audioRegistry) {
      try {
        a.pause()
        a.currentTime = 0
        a.src = ''
        a.load()
      } catch {}
    }
    SubwaySurfersGame.audioRegistry.clear()
  }
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private renderer: THREE.WebGLRenderer | null = null
  private questions: QuestionsData | null = null
  private subwayModel: THREE.Group | null = null
  private characterModel: THREE.Group | null = null
  private animationMixer: AnimationMixer | null = null
  private currentAction: AnimationAction | null = null
  private gltfLoader: GLTFLoader
  private fbxLoader: FBXLoader
  private gameSpeed: number = 1.0 // Speed of forward movement (increased)
  private mapOffset: number = 0 // Track how far the map has moved
  private characterPosition: number = 0 // Track character's position along the track
  private characterXPosition: number = 0 // Track character's horizontal position (left/right)
  private characterHeight: number = 0 // Cached character height for camera follow
  private obstacles: THREE.Box3[] = [] // World-space bounding boxes for trains/obstacles
  // Quiz state
  private currentQuestionIndex: number = 0
  private optionBoxes: { mesh: THREE.Mesh, optionIndex: number }[] = []
  private optionLabels: THREE.Sprite[] = []
  private activeObstacleIndex: number = -1
  private selectedOptionIndex: number | null = null
  private hudSprite: THREE.Sprite | null = null
  private scoreSprite: THREE.Sprite | null = null
  private lateralSpeed: number = 10.0 // Speed of left/right movement (increased)
  private trackHeight: number = 0.1 // Track height for camera positioning
  private cameraFollowDistance: number = 12.0 // Distance camera follows behind character (meters)
  private keysPressed: Set<string> = new Set() // Track which keys are currently pressed
  private cameraZPosition: number = 0 // Track camera's forward position
  private mapLengthZ: number = 0 // Total length of the map along Z (for auto traversal)
  private autoTraverse: boolean = false // By default, follow the character instead of auto flythrough
  private cameraTravelSpeed: number = 12.0 // m/s when auto-traversing the map
  // Simple gravity for the runner (currently unused)
  private gravityStrength: number = 0 // m/s^2 (set >0 if we re-enable gravity)
  private verticalVelocity: number = 0 // m/s
  private isGrounded: boolean = false
  private groundY: number = 0 // world Y where the track surface is
  // Slightly above ground to place the runner's feet on the visible track
  private trackSurfaceY: number = 0
  // Simple orbit controls
  private isDragging: boolean = false
  private lastPointerX: number = 0
  private lastPointerY: number = 0
  private orbitYaw: number = 0
  private orbitPitch: number = 0
  private orbitRadius: number = 20
  private minOrbitRadius: number = 5
  private maxOrbitRadius: number = 150
  // HUD config
  private hudYOffsetFactor: number = 2.9
  // Option spawn config
  private optionSpawnAheadDistance: number = 70.0 // meters ahead of runner (fallback) - further increased
  private optionSpawnPlayerSideOffsetFromObstacle: number = 40.0 // meters before obstacle toward player - further increased
  private optionHorizontalOffset: number = -1.0 // shift boxes slightly left (negative -> left)
  private optionVerticalOffset: number = 1.2 // box height above track surface
  // Flying character config
  private isFlyingMode: boolean = true
  private flightAltitude: number = 21.0 // meters above track surface
  private characterVerticalOffset: number = -3.0 // character offset relative to flightAltitude (negative lowers only character)
  // Cached FBX variants
  private flyingFBX: THREE.Group | null = null
  private fallingFBX: THREE.Group | null = null
  private fallingFlatFBX: THREE.Group | null = null
  private isPlayingFailSequence: boolean = false
  // Camera impact animation (dip down then recover)
  private failCamAnim:
    | { active: true; startMs: number; downDurationMs: number; upDurationMs: number; heightDip: number }
    | { active: false } = { active: false }
  // Infinite map tiling
  private mapSegments: THREE.Group[] = []
  private segmentLength: number = 0
  // Wrong answer blinking overlay
  private wrongSprite: THREE.Sprite | null = null
  private wrongStartMs: number = 0
  // Round transitions (between recycled map segments)
  private roundIndex: number = 1
  private isRoundTransition: boolean = false
  private roundPauseUntilMs: number = 0
  private roundSprite: THREE.Sprite | null = null
  // Start menu
  private isMenuActive: boolean = false
  private menuEl: HTMLDivElement | null = null
  private menuAudio: HTMLAudioElement | null = null
  private isSoundMuted: boolean = false
  private bgAudio: HTMLAudioElement | null = null
  private fallingSfx: HTMLAudioElement | null = null
  private dyingSfx: HTMLAudioElement | null = null
  private bgOnVisibilityChange: (() => void) | null = null
  private bgOnPageHide: (() => void) | null = null
  private bgOnBeforeUnload: (() => void) | null = null
  // Quiz progress/score
  private totalQuestions: number = 0
  private questionsAnswered: number = 0
  private correctAnswers: number = 0
  private quizStartedAtMs: number = 0
  private quizComplete: boolean = false
  private resultEl: HTMLDivElement | null = null

  constructor(
    width: number,
    height: number,
    questions?: QuestionsData
  ) {
    super(width, height)
    this.questions = questions || null
    this.gltfLoader = new GLTFLoader()
    this.fbxLoader = new FBXLoader()
  }

  /**
   * Traverse the subway model and create obstacle bounding boxes for trains
   * or other large meshes that sit over the tracks.
   *
   * The GLTF doesn't label meshes as "train", so we detect them heuristically:
   * - reasonably tall
   * - long in the Z direction (along the track)
   * - positioned around the track surface height
   */
  private collectTrainObstacles(): void {
    if (!this.subwayModel) return

    const obstacles: THREE.Box3[] = []

    this.subwayModel.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return

      const box = new THREE.Box3().setFromObject(child)
      if (box.isEmpty()) return

      const size = box.getSize(new THREE.Vector3())

      // Ignore tiny meshes, overly flat geometry, or giant world meshes
      const minHeight = 2
      const maxHeight = 10
      const minLengthZ = 5
      const maxLengthZ = 120
      const minWidthX = 1
      const maxWidthX = 6
      if (
        size.y < minHeight || size.y > maxHeight ||
        size.z < minLengthZ || size.z > maxLengthZ ||
        size.x < minWidthX || size.x > maxWidthX
      ) {
        return
      }

      // Only consider meshes that sit roughly at track height (trains on rails).
      const trackY = this.trackSurfaceY
      // Require the obstacle to intersect a band around the track surface
      const nearTrackMinY = trackY - 0.25
      const nearTrackMaxY = trackY + 2.5
      if (box.max.y < nearTrackMinY || box.min.y > nearTrackMaxY) {
        return
      }

      // Expand the box slightly to give a comfortable collision margin
      const expand = 0.5
      box.min.x -= expand
      box.max.x += expand
      box.min.y -= expand
      box.max.y += expand
      box.min.z -= expand
      box.max.z += expand

      obstacles.push(box)
    })

    this.obstacles = obstacles
    console.log('Collected train obstacles:', this.obstacles.length)
  }

  // Create or update a HUD sprite that shows the current question at the top of the screen
  private updateHudSprite(): void {
    if (!this.scene || !this.camera) return
    const hasQuestions = !!this.questions && this.questions.questions.length > 0
    const text = hasQuestions
      ? this.questions!.questions[this.currentQuestionIndex % this.questions!.questions.length].question
      : 'No questions'

    // Draw text to an offscreen canvas
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 48px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    })

    if (!this.hudSprite) {
      this.hudSprite = new THREE.Sprite(material)
      this.hudSprite.center.set(0.5, 1.0) // anchor top-center
      this.hudSprite.renderOrder = 999
      this.scene.add(this.hudSprite)
    } else {
      this.hudSprite.material.dispose()
      ;(this.hudSprite.material as THREE.SpriteMaterial).map?.dispose()
      this.hudSprite.material = material
      this.hudSprite.renderOrder = 999
    }
  }
  
  // Create or update a small score HUD at top-left
  private updateScoreSprite(): void {
    if (!this.scene || !this.camera) return
    const total = this.totalQuestions || (this.questions?.questions?.length || 0)
    const correct = this.correctAnswers
    const answered = this.questionsAnswered
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0
    const line1 = `Score: ${correct}/${total} (${percent}%)`
    const line2 = `Answered: ${answered}/${total}`
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 140
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(line1, 18, 14)
      ctx.font = 'bold 22px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(line2, 18, 72)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    })
    if (!this.scoreSprite) {
      this.scoreSprite = new THREE.Sprite(material)
      this.scoreSprite.center.set(1.0, 1.0) // top-right anchor
      this.scoreSprite.renderOrder = 999
      this.scene.add(this.scoreSprite)
    } else {
      this.scoreSprite.material.dispose()
      ;(this.scoreSprite.material as THREE.SpriteMaterial).map?.dispose()
      this.scoreSprite.material = material
      this.scoreSprite.renderOrder = 999
    }
  }

  init(): void {
    this.setState({ score: 0, level: 1, lives: 3, isPaused: false, isGameOver: false })
    // Ensure questions are loaded if not passed in
    this.loadQuestionsIfMissing()
    // Start background music for gameplay
    this.startBackgroundMusic()
    // Preload SFX
    this.preloadSfx()
    // Expose a global stopper for safety (used by container)
    if (typeof window !== 'undefined') {
      ;(window as any).__nyuStopAllAudio = () => SubwaySurfersGame.stopAllAudio()
    }
    this.quizStartedAtMs = performance.now()
    // Ensure no score HUD is visible during gameplay
    if (this.scoreSprite) {
      const mat = this.scoreSprite.material as THREE.SpriteMaterial
      if (mat.map) mat.map.dispose()
      mat.dispose()
      if (this.scene) this.scene.remove(this.scoreSprite)
      this.scoreSprite = null
    }
  }

  private initializeThreeJS(canvas: HTMLCanvasElement): void {
    if (this.scene && this.camera && this.renderer) {
      return // Already initialized
    }

    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // Sky blue

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      0.1,
      1000
    )
    this.camera.position.set(0, 5, 10)
    this.camera.lookAt(0, 0, 0)
    // Initialize orbit parameters
    this.orbitRadius = this.camera.position.length()
    this.orbitYaw = Math.atan2(this.camera.position.x, this.camera.position.z)
    this.orbitPitch = Math.asin(this.camera.position.y / this.orbitRadius)

    // Create renderer - use preserveDrawingBuffer to prevent context loss
    try {
      this.renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true
      })
      this.renderer.setSize(this.width, this.height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this.renderer.setClearColor(0x87ceeb, 1)
      console.log('Three.js renderer initialized successfully')
      console.log('Canvas size:', this.width, this.height)
    } catch (error) {
      console.error('Failed to initialize Three.js renderer:', error)
      return
    }

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    this.scene.add(directionalLight)

    // Add a test cube first to verify rendering works
    const testGeometry = new THREE.BoxGeometry(1, 1, 1)
    const testMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const testCube = new THREE.Mesh(testGeometry, testMaterial)
    testCube.position.set(0, 0, 0)
    testCube.userData.isTestCube = true
    this.scene.add(testCube)
    console.log('Added test cube to verify rendering')

    // Load subway surfers model
    this.loadSubwayModel()

    // Enable simple drag-to-orbit controls
    canvas.addEventListener('pointerdown', this.handlePointerDown)
    canvas.addEventListener('pointermove', this.handlePointerMove)
    window.addEventListener('pointerup', this.handlePointerUp)
    canvas.addEventListener('wheel', this.handleWheel, { passive: true })
  }

  // Load questions.json if not injected: try import first, then public paths
  private async loadQuestionsIfMissing(): Promise<void> {
    if (this.questions && this.questions.questions?.length) return
    // Attempt 1: import from source
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - allow runtime import of json
      const mod = await import('@/games/subway-surfers/questions.json')
      this.questions = mod.default || mod
      this.currentQuestionIndex = 0
      this.totalQuestions = (this.questions?.questions?.length as number) || 0
      this.updateHudSprite()
      console.log('Loaded questions via import:', this.questions?.questions?.length || 0)
      return
    } catch (e) {
      console.warn('Import of questions.json failed, falling back to fetch:', e)
    }
    // Attempt 2: fetch from public root
    try {
      const tryFetch = async (path: string) => {
        const r = await fetch(path, { cache: 'no-store' })
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${path}`)
        return r.json()
      }
      let data = null as any
      try {
        data = await tryFetch('/questions.json')
      } catch {
        data = await tryFetch('/games/subway-surfers/questions.json')
      }
      this.questions = data
      this.currentQuestionIndex = 0
      this.totalQuestions = (this.questions?.questions?.length as number) || 0
      this.updateHudSprite()
      console.log('Loaded questions via fetch:', this.questions?.questions?.length || 0)
    } catch (e) {
      console.warn('Could not load questions.json from public:', e)
    }
  }

  private async loadSubwayModel(): Promise<void> {
    if (!this.scene) return

    try {
      // Load from public folder - assets should be accessible at this path
      const modelPath = '/games/subway-surfers/assets/subway_surfers_maps/scene.gltf'
      console.log('Loading subway surfers model from:', modelPath)
      console.log('Full URL would be:', window.location.origin + modelPath)
      
      const gltf = await this.gltfLoader.loadAsync(
        modelPath,
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%')
        }
      )
      
      console.log('GLTF loaded, scene:', gltf.scene)
      this.subwayModel = gltf.scene
      
      // Remove test cube if it exists
      const testCube = this.scene.children.find(child => 
        child instanceof THREE.Mesh && child.userData.isTestCube
      )
      if (testCube) {
        this.scene.remove(testCube)
        if (testCube instanceof THREE.Mesh) {
          testCube.geometry.dispose()
          if (testCube.material instanceof THREE.Material) {
            testCube.material.dispose()
          }
        }
        console.log('Removed test cube')
      }
      
      // First, rotate the model so the starting point (right side) faces forward
      // -90 degrees rotation around Y axis makes the right side face the camera
      this.subwayModel.rotation.y = -Math.PI / 2
      
      // Scale the model if needed (keep it at 1,1,1 for now)
      this.subwayModel.scale.set(1, 1, 1)
      
      // Calculate bounding box AFTER rotation to get accurate center
        const box = new THREE.Box3().setFromObject(this.subwayModel)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
      console.log('Model bounds after rotation - center:', center, 'size:', size)
      
      // Center the model at the origin by offsetting its position
      // This centers it after rotation
      this.subwayModel.position.set(-center.x, -center.y, -center.z)
      // Save map length for camera auto traversal and compute ground height from the map
      this.mapLengthZ = size.z
      this.segmentLength = size.z
      const worldBox = new THREE.Box3().setFromObject(this.subwayModel)
      this.groundY = worldBox.min.y
      // Estimate the actual running surface a bit above the absolute minimum.
      // Slightly raised (0.33 of map height) to move the character a tiny bit up.
      this.trackSurfaceY = this.groundY + size.y * 0.33
      
      // Setup infinite tiling: two segments, second placed ahead (negative Z)
      const seg0 = this.subwayModel
      const seg1 = seg0.clone(true)
      // Place segments exactly back-to-back with a tiny overlap to avoid gaps
      const epsilon = 0.01
      seg0.position.z = 0
      seg1.position.z = -this.segmentLength + epsilon
      this.scene.add(seg0)
      this.scene.add(seg1)
      this.mapSegments = [seg0, seg1]
      console.log('Subway surfers model added to scene and centered with tiling')
      console.log('Model children count:', this.subwayModel.children.length)

      // Detect trains/large meshes in the map and create obstacle volumes
      this.collectTrainObstacles()
      // Initialize HUD with first question if any
      this.updateHudSprite()

      // Adjust camera to fit the model and center it in view
      if (this.subwayModel && this.camera) {
        // Recalculate bounding box after centering to get final size
        const centeredBox = new THREE.Box3().setFromObject(this.subwayModel)
        const centeredSize = centeredBox.getSize(new THREE.Vector3())
        
        // Position camera to view the centered model - straight ahead down the tracks
        const maxDim = Math.max(centeredSize.x, centeredSize.y, centeredSize.z)
        if (maxDim > 0) {
          // Position camera low to the ground, looking straight down the tracks
          // Since model is rotated -90 degrees, tracks extend along -Z axis
          // Position camera at starting point, low to ground, looking forward
          this.trackHeight = maxDim * 0.0005 // Extremely close to ground level
          this.cameraFollowDistance = 12.0 // Place camera farther back for a wider view
          
          // Initialize camera Z position
          this.cameraZPosition = 0
          
          // Camera positioned at the start of tracks, extremely close to ground but farther back
          this.camera.position.set(0, this.trackHeight, this.cameraFollowDistance)
          // Look straight ahead down the tracks (negative Z direction)
          this.camera.lookAt(0, this.trackHeight, -maxDim * 0.3)
          this.camera.updateProjectionMatrix()
          console.log('Camera adjusted to straight-ahead track view')
        }
      }
      
      // Load character after map is loaded
      this.loadCharacter()
    } catch (error) {
      console.error('Failed to load subway surfers model:', error)
      console.error('Error details:', error instanceof Error ? error.message : String(error))
      // Add a simple placeholder cube if model fails to load
      const geometry = new THREE.BoxGeometry(2, 2, 2)
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
      const cube = new THREE.Mesh(geometry, material)
      cube.position.set(0, 1, 0)
      this.scene.add(cube)
      console.log('Added placeholder cube due to load failure')
    }
  }

  // Pointer-based orbit controls
  private handlePointerDown = (event: PointerEvent) => {
    if (!this.camera) return
    this.isDragging = true
    this.lastPointerX = event.clientX
    this.lastPointerY = event.clientY
  }

  private handlePointerMove = (event: PointerEvent) => {
    if (!this.camera || !this.isDragging) return

    const deltaX = event.clientX - this.lastPointerX
    const deltaY = event.clientY - this.lastPointerY
    this.lastPointerX = event.clientX
    this.lastPointerY = event.clientY

    const rotationSpeed = 0.005
    this.orbitYaw -= deltaX * rotationSpeed
    this.orbitPitch -= deltaY * rotationSpeed

    const maxPitch = Math.PI / 3
    const minPitch = -Math.PI / 6
    this.orbitPitch = Math.max(minPitch, Math.min(maxPitch, this.orbitPitch))

    const x = this.orbitRadius * Math.sin(this.orbitYaw) * Math.cos(this.orbitPitch)
    const y = this.orbitRadius * Math.sin(this.orbitPitch)
    const z = this.orbitRadius * Math.cos(this.orbitYaw) * Math.cos(this.orbitPitch)

    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 0, 0)
  }

  private handlePointerUp = () => {
    this.isDragging = false
  }

  // Mouse wheel zoom for orbit camera
  private handleWheel = (event: WheelEvent) => {
    if (!this.camera) return

    const zoomDelta = event.deltaY * 0.01
    this.orbitRadius = Math.max(
      this.minOrbitRadius,
      Math.min(this.maxOrbitRadius, this.orbitRadius + zoomDelta)
    )

    const x = this.orbitRadius * Math.sin(this.orbitYaw) * Math.cos(this.orbitPitch)
    const y = this.orbitRadius * Math.sin(this.orbitPitch)
    const z = this.orbitRadius * Math.cos(this.orbitYaw) * Math.cos(this.orbitPitch)

    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 0, 0)
  }

  private async loadCharacter(): Promise<void> {
    if (!this.scene) return

    try {
      if (this.isFlyingMode) {
        // Load flying FBX character from public root
        const characterPath = '/Flying.fbx'
        console.log('Loading flying FBX character from:', characterPath)
        const fbx = await this.fbxLoader.loadAsync(characterPath)
        this.characterModel = fbx
        this.flyingFBX = fbx
        // FBX scale: increase for better visibility
        this.characterModel.scale.set(0.28, 0.28, 0.28)
        this.characterModel.rotation.y = Math.PI

        // Compute bounds for height
        const charBox = new THREE.Box3().setFromObject(this.characterModel)
        const charSize = charBox.getSize(new THREE.Vector3())
        const charCenter = charBox.getCenter(new THREE.Vector3())
        this.characterHeight = charSize.y

        if (this.camera) {
          const targetPos = this.camera.position.clone()
          targetPos.x -= 1
          // Fly at altitude above track surface
          const charBottomY = charCenter.y - charSize.y / 2
          const desiredY = this.trackSurfaceY + this.flightAltitude + this.characterVerticalOffset
          const worldY = desiredY - charBottomY

          // Start deeper into the map along -Z for a broader track view
          this.characterModel.position.set(targetPos.x, worldY, -140)

          this.characterPosition = this.characterModel.position.z
          this.characterXPosition = this.characterModel.position.x

          // Camera follow a bit behind and above
          const characterWorldPos = this.characterModel.position.clone()
          const cameraBehindDistance = 10
          const cameraHeightOffset = (this.characterHeight || 2) * 0.9
          this.camera.position.set(
            characterWorldPos.x,
            characterWorldPos.y + cameraHeightOffset,
            characterWorldPos.z + cameraBehindDistance
          )
          this.camera.lookAt(
            characterWorldPos.x,
            characterWorldPos.y,
            characterWorldPos.z
          )
        }

        this.scene.add(this.characterModel)
        console.log('Flying FBX character loaded and positioned')

        // Play first available animation if present
        const anyAnimations = (fbx as any).animations as THREE.AnimationClip[] | undefined
        if (anyAnimations && anyAnimations.length > 0) {
          this.animationMixer = new AnimationMixer(this.characterModel)
          const chosenClip = anyAnimations[0]
          this.currentAction = this.animationMixer.clipAction(chosenClip)
          this.currentAction.enabled = true
          this.currentAction.setEffectiveWeight(1.0)
          this.currentAction.setLoop(THREE.LoopRepeat, Infinity)
          this.currentAction.clampWhenFinished = false
          this.currentAction.timeScale = 1.0
          this.currentAction.play()
          console.log('Playing FBX animation:', chosenClip.name)
        }

        // Preload failure animations (non-blocking)
        this.fbxLoader.load('/Falling.fbx', (fall) => {
          fall.scale.set(0.28, 0.28, 0.28)
          fall.rotation.y = Math.PI
          this.fallingFBX = fall
          ;(fall as any).animations = (fall as any).animations || []
        })
        this.fbxLoader.load('/Falling Flat Impact.fbx', (flat) => {
          flat.scale.set(0.28, 0.28, 0.28)
          flat.rotation.y = Math.PI
          this.fallingFlatFBX = flat
          ;(flat as any).animations = (flat as any).animations || []
        })
      } else {
        // Load Jake (GLTF) fallback
        const characterPath = '/games/subway-surfers/jake_subway_surfers/scene.gltf'
        console.log('Loading jake_subway_surfers model from:', characterPath)
        const gltf = await this.gltfLoader.loadAsync(characterPath)
        this.characterModel = gltf.scene
        this.characterModel.rotation.y = Math.PI
        this.characterModel.scale.set(1.5, 1.5, 1.5)

        const charBox = new THREE.Box3().setFromObject(this.characterModel)
        const charSize = charBox.getSize(new THREE.Vector3())
        const charCenter = charBox.getCenter(new THREE.Vector3())
        this.characterHeight = charSize.y

        if (this.camera) {
          const targetPos = this.camera.position.clone()
          targetPos.x -= 1
          const charBottomY = charCenter.y - charSize.y / 2
          const desiredFeetY = this.trackSurfaceY + 0.15
          const worldY = desiredFeetY - charBottomY
          this.characterModel.position.set(targetPos.x, worldY, targetPos.z)
          this.characterPosition = this.characterModel.position.z
          this.characterXPosition = this.characterModel.position.x
        }

        this.scene.add(this.characterModel)
        if (gltf.animations && gltf.animations.length > 0) {
          this.animationMixer = new AnimationMixer(this.characterModel)
          const clips = gltf.animations
          let chosenClip = clips[0]
          const runClip = clips.find((clip) => /run/i.test(clip.name))
          if (runClip) chosenClip = runClip
          this.currentAction = this.animationMixer.clipAction(chosenClip)
          this.currentAction.enabled = true
          this.currentAction.setEffectiveWeight(1.0)
          this.currentAction.setLoop(THREE.LoopRepeat, Infinity)
          this.currentAction.clampWhenFinished = false
          this.currentAction.timeScale = 1.2
          this.currentAction.play()
        }
      }
    } catch (error) {
      console.error('Failed to load jake_subway_surfers model:', error)
      // Simple placeholder capsule character
      const geometry = new THREE.BoxGeometry(0.7, 1.8, 0.7)
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
      const character = new THREE.Mesh(geometry, material)
      this.characterModel = new THREE.Group()
      this.characterModel.add(character)
      this.characterModel.rotation.y = Math.PI
      this.characterModel.scale.set(1.5, 1.5, 1.5)

      // Approximate height for placeholder
      this.characterHeight = 1.8 * 1.5

      this.characterPosition = 0
      this.characterXPosition = 0
      // Place placeholder directly in front of the camera, matching Jake's vertical offset behavior
      if (this.camera) {
        // Start from the camera position, then shift slightly left on the X axis
        const targetPos = this.camera.position.clone()
        targetPos.x -= 1 // small horizontal offset to the left

        // Match Jake's feet-on-track placement, independent of scale.
        const placeholderBottomY = -0.9 // local bottom of placeholder mesh
        const desiredFeetY = this.trackSurfaceY + 0.15
        const worldY = desiredFeetY - placeholderBottomY

        this.characterModel.position.set(
          targetPos.x,
          worldY,
          targetPos.z
        )

        // Cache starting track positions for movement
        this.characterPosition = this.characterModel.position.z
        this.characterXPosition = this.characterModel.position.x

        // Position camera slightly behind and above the placeholder character
        const characterWorldPos = this.characterModel.position.clone()
        const cameraBehindDistance = 8
        const cameraHeightOffset = 1.2 // approximate height for placeholder

        this.camera.position.set(
          characterWorldPos.x,
          characterWorldPos.y + cameraHeightOffset,
          characterWorldPos.z + cameraBehindDistance
        )
        this.camera.lookAt(
          characterWorldPos.x,
          characterWorldPos.y + cameraHeightOffset * 0.8,
          characterWorldPos.z
        )
      } else {
        this.characterModel.position.set(0, 0, -5)
      }

      this.scene.add(this.characterModel)
      console.log('Added placeholder runner instead of Jake')
    }
  }

  update(deltaTime: number): void {
    // Manage background music according to play/pause/gameOver/menu state
    const state = this.getState()
    if (this.bgAudio) {
      const shouldPlay = !state.isPaused && !state.isGameOver && !this.isMenuActive
      if (shouldPlay) {
        if (this.bgAudio.paused) {
          this.bgAudio.play().catch(() => {})
        }
      } else {
        if (!this.bgAudio.paused) {
          this.bgAudio.pause()
        }
      }
    }
    if (state.isPaused || state.isGameOver || this.isMenuActive) {
      return
    }

    // Update animation mixer
    if (this.animationMixer) {
      this.animationMixer.update(deltaTime / 1000) // Convert to seconds
    }

    // If we don't have a character or camera yet, nothing to move
    if (!this.characterModel || !this.camera) {
      return
    }

    // Time in seconds
    const dt = deltaTime / 1000

    // --- Forward running (Subway Surfers style) ---
    // Compute intended new position
    const forwardSpeed = 12 * this.gameSpeed // meters per second
    let nextZ = this.characterPosition - forwardSpeed * dt

    // --- Horizontal movement with A/D keys ---
    let nextX = this.characterXPosition
    if (this.keysPressed.has('a')) {
      nextX -= this.lateralSpeed * dt
    }
    if (this.keysPressed.has('d')) {
      nextX += this.lateralSpeed * dt
    }

    // Optionally clamp horizontal movement to stay near the center lanes
    const maxSideOffset = 6
    nextX = Math.max(-maxSideOffset, Math.min(maxSideOffset, nextX))

    // --- Simple obstacle collision check (AABB) ---
    if (this.obstacles.length > 0) {
      // Approximate the runner as a small box around his feet/legs.
      const halfWidth = 0.8
      const halfDepth = 0.8
      const feetY = this.trackSurfaceY
      const runnerMinY = feetY
      const runnerMaxY = feetY + Math.max(1.0, (this.characterHeight || 2) * 0.6)

      // We move toward negative Z, so if we would enter an obstacle,
      // clamp nextZ to just in front of it.
      for (const box of this.obstacles) {
        const candidateMinX = nextX - halfWidth
        const candidateMaxX = nextX + halfWidth
        const candidateMinZ = nextZ - halfDepth
        const candidateMaxZ = nextZ + halfDepth

        const intersectsX =
          candidateMaxX >= box.min.x && candidateMinX <= box.max.x
        const intersectsZ =
          candidateMaxZ >= box.min.z && candidateMinZ <= box.max.z
        const intersectsY =
          runnerMaxY >= box.min.y && runnerMinY <= box.max.y

        if (intersectsX && intersectsZ && intersectsY) {
          // Place the character just in front of the obstacle, so they can't run through the train.
          nextZ = box.max.z + halfDepth
        }
      }
    }

    // Commit final positions
    this.characterPosition = nextZ
    this.characterXPosition = nextX

    const currentY = this.characterModel.position.y
    this.characterModel.position.set(this.characterXPosition, currentY, this.characterPosition)

    // --- Third-person camera follow (GTA-style) ---
    const characterWorldPos = this.characterModel.position.clone()
    if (this.isFlyingMode) {
      // GTA-style chase cam for flying: closer follow distance
      const cameraBehindDistance = 9
      // Base camera height above ground or flight altitude
      let cameraHeight = this.trackSurfaceY + this.flightAltitude + 4
      // If fail cam animation active, blend a dip
      if (this.failCamAnim.active) {
        const now = performance.now()
        const elapsed = now - this.failCamAnim.startMs
        const down = this.failCamAnim.downDurationMs
        const up = this.failCamAnim.upDurationMs
        if (elapsed <= down) {
          const t = Math.max(0, Math.min(1, elapsed / down))
          cameraHeight += -this.failCamAnim.heightDip * t
        } else if (elapsed <= down + up) {
          const t = Math.max(0, Math.min(1, (elapsed - down) / up))
          cameraHeight += -this.failCamAnim.heightDip * (1 - t)
        } else {
          this.failCamAnim = { active: false }
        }
      }
      this.camera.position.set(
        characterWorldPos.x,
        cameraHeight,
        characterWorldPos.z + cameraBehindDistance
      )
      this.camera.lookAt(
        characterWorldPos.x,
        this.trackSurfaceY + this.flightAltitude,
        characterWorldPos.z
      )
    } else {
      const cameraBehindDistance = 8
      const cameraHeightOffset =
        (this.characterHeight || 2) * 0.7 // fallback height if not set

      this.camera.position.set(
        characterWorldPos.x,
        characterWorldPos.y + cameraHeightOffset,
        characterWorldPos.z + cameraBehindDistance
      )

      this.camera.lookAt(
        characterWorldPos.x,
        characterWorldPos.y + (this.characterHeight || 2) * 0.6,
        characterWorldPos.z
      )
    }

    // Keep HUD sprite fixed to top of the view (always in front of camera)
    if (this.hudSprite) {
      const hudDistance = 6
      const hudHeight = (this.characterHeight || 2) * this.hudYOffsetFactor
      const forward = new THREE.Vector3()
      this.camera.getWorldDirection(forward)
      const hudPos = this.camera.position.clone().add(forward.multiplyScalar(hudDistance))
      hudPos.y += hudHeight
      this.hudSprite.scale.set(6, 0.8, 1) // screen size in world units
      this.hudSprite.position.copy(hudPos)
      this.hudSprite.lookAt(this.camera.position)
    }
    // Position score HUD at top-left relative to camera
    if (this.scoreSprite) {
      const dist = 6.0
      const hudHeight = (this.characterHeight || 2) * this.hudYOffsetFactor
      const forward = new THREE.Vector3()
      const right = new THREE.Vector3(1, 0, 0)
      this.camera.getWorldDirection(forward)
      // Derive right vector from camera matrix
      this.camera.updateMatrixWorld()
      right.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize()
      const pos = this.camera.position.clone().add(forward.multiplyScalar(dist))
      pos.add(right.clone().multiplyScalar(3.2)) // shift right
      pos.y += hudHeight
      this.scoreSprite.scale.set(3.0, 0.9, 1)
      this.scoreSprite.position.copy(pos)
      this.scoreSprite.lookAt(this.camera.position)
    }

    // Position round overlay (if active)
    if (this.roundSprite) {
      const forward = new THREE.Vector3()
      this.camera.getWorldDirection(forward)
      const dist = 6.0
      const y = (this.characterHeight || 2) * (this.hudYOffsetFactor - 0.4)
      const pos = this.camera.position.clone().add(forward.multiplyScalar(dist))
      pos.y += y
      this.roundSprite.scale.set(6.5, 1.2, 1)
      this.roundSprite.position.copy(pos)
      this.roundSprite.lookAt(this.camera.position)
      // Auto remove when pause is over
      if (performance.now() > this.roundPauseUntilMs) {
        const ms = this.roundSprite.material as THREE.SpriteMaterial
        if (ms.map) ms.map.dispose()
        ms.dispose()
        this.scene?.remove(this.roundSprite)
        this.roundSprite = null
        this.isRoundTransition = false
      }
    }
    // Keep option labels facing camera and positioned above their boxes
    if (this.optionLabels.length > 0 && this.optionBoxes.length === this.optionLabels.length) {
      for (let i = 0; i < this.optionLabels.length; i++) {
        const label = this.optionLabels[i]
        const box = this.optionBoxes[i].mesh
        const pos = box.position.clone()
        pos.y += 1.1
        label.position.copy(pos)
        label.scale.set(2.5, 0.75, 1)
        label.lookAt(this.camera.position)
      }
    }

    // Update wrong answer blinking sprite position and opacity if active
    if (this.wrongSprite) {
      const now = performance.now()
      // Blink alpha 3-4 times per second
      const alpha = 0.5 + 0.5 * Math.sin((now - this.wrongStartMs) / 150)
      const mat = this.wrongSprite.material as THREE.SpriteMaterial
      mat.opacity = Math.max(0.2, Math.min(1.0, alpha))
      // Position in front of camera, centered horizontally, just below the question banner
      const forward = new THREE.Vector3()
      this.camera.getWorldDirection(forward)
      const dist = 6.0
      const hudHeight = (this.characterHeight || 2) * this.hudYOffsetFactor
      const belowOffset = 2.0 // how far below the question banner
      const pos = this.camera.position.clone().add(forward.multiplyScalar(dist))
      pos.y += hudHeight - belowOffset
      this.wrongSprite.scale.set(6.0, 1.6, 1)
      this.wrongSprite.position.copy(pos)
      this.wrongSprite.lookAt(this.camera.position)
    }

    // If there is no active set of option boxes, try to spawn in front of the next obstacle ahead
    const nowMs = performance.now()
    if (!this.isPlayingFailSequence &&
        !this.isRoundTransition &&
        nowMs > this.roundPauseUntilMs &&
        this.optionBoxes.length === 0 &&
        this.questions && this.questions.questions.length > 0) {
      if (this.obstacles.length > 0) {
        const nextIdx = this.findNextObstacleAhead(this.characterPosition)
        if (nextIdx !== -1) {
          this.activeObstacleIndex = nextIdx
          this.spawnOptionBoxes(this.obstacles[nextIdx])
        } else {
          // Fallback: spawn a set of options a few meters ahead of the runner
          this.spawnOptionBoxesAheadOfRunner()
        }
      } else {
        // No obstacles detected in map; always fallback-spawn ahead of runner
        this.spawnOptionBoxesAheadOfRunner()
      }
    }

    // Check collisions with option boxes
    if (this.optionBoxes.length > 0) {
      const halfWidth = 0.8
      const halfDepth = 0.8
      const candidateMinX = this.characterXPosition - halfWidth
      const candidateMaxX = this.characterXPosition + halfWidth
      const candidateMinZ = this.characterPosition - halfDepth
      const candidateMaxZ = this.characterPosition + halfDepth

      for (const opt of this.optionBoxes) {
        const box = new THREE.Box3().setFromObject(opt.mesh)
        const intersectsX = candidateMaxX >= box.min.x && candidateMinX <= box.max.x
        const intersectsZ = candidateMaxZ >= box.min.z && candidateMinZ <= box.max.z
        if (intersectsX && intersectsZ && this.selectedOptionIndex === null) {
          this.handleOptionSelected(opt.optionIndex)
          break
        }
      }
    }

    // Recycle map segments for infinite scrolling
    if (this.mapSegments.length >= 2 && this.segmentLength > 0) {
      // Moving toward -Z; when the character is beyond a segment by one length,
      // move that segment in front of the foremost segment.
      const epsilon = 0.01
      let foremostZ = Math.min(...this.mapSegments.map(s => s.position.z))
      for (const seg of this.mapSegments) {
        const segFrontEdge = seg.position.z - this.segmentLength + epsilon
        if (this.characterPosition < segFrontEdge - 2) {
          // Move seg ahead of the foremost
          seg.position.z = foremostZ - this.segmentLength + epsilon
          foremostZ = seg.position.z
          // Trigger round transition overlay and pause questions briefly
          this.roundIndex += 1
          this.showRoundOverlay(`Round ${this.roundIndex} starting`)
          this.isRoundTransition = true
          this.roundPauseUntilMs = performance.now() + 2500
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const canvas = ctx.canvas

    // Initialize Three.js on first render
    if (!this.renderer) {
      this.initializeThreeJS(canvas)
    }

    // Render Three.js scene
    if (this.scene && this.camera && this.renderer) {
      // Update renderer size if canvas size changed
      if (this.renderer.domElement.width !== this.width || 
          this.renderer.domElement.height !== this.height) {
        this.renderer.setSize(this.width, this.height)
        if (this.camera) {
          this.camera.aspect = this.width / this.height
          this.camera.updateProjectionMatrix()
        }
      }
      
      // Render the scene
      try {
      this.renderer.render(this.scene, this.camera)
      } catch (error) {
        console.error('Error rendering Three.js scene:', error)
        // Fallback to 2D rendering if ctx supports it
        if (ctx && typeof ctx.fillStyle !== 'undefined') {
          ctx.fillStyle = '#1a1a1a'
          ctx.fillRect(0, 0, this.width, this.height)
          ctx.fillStyle = '#fff'
          ctx.font = '24px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('Rendering Error', this.width / 2, this.height / 2)
          ctx.textAlign = 'left'
        }
      }
    } else {
      // Fallback placeholder - only if ctx supports 2D rendering
      if (ctx && typeof ctx.fillStyle !== 'undefined') {
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, this.width, this.height)
      
      ctx.fillStyle = '#fff'
      ctx.font = '24px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Subway Surfers', this.width / 2, this.height / 2 - 20)
      ctx.font = '16px monospace'
      ctx.fillText('Loading...', this.width / 2, this.height / 2 + 20)
      ctx.textAlign = 'left'
      }
    }
  }

  // Find the nearest obstacle ahead of the given z position
  private findNextObstacleAhead(currentZ: number): number {
    let bestIdx = -1
    let bestZ = Infinity
    for (let i = 0; i < this.obstacles.length; i++) {
      const box = this.obstacles[i]
      // Obstacle is "ahead" if its max.z is less than currentZ (since we run toward -Z)
      if (box.max.z < currentZ && box.max.z > -Infinity) {
        if (box.max.z > -bestZ) {
          // not needed; use simpler compare
        }
      }
      if (box.max.z < currentZ && currentZ - box.max.z < bestZ) {
        bestZ = currentZ - box.max.z
        bestIdx = i
      }
    }
    return bestIdx
  }

  // Spawn option boxes for the current question in front of the obstacle box
  private spawnOptionBoxes(obstacle: THREE.Box3): void {
    if (!this.scene || !this.questions || this.questions.questions.length === 0) return
    // Clear any previous
    this.clearOptionBoxes()
    this.selectedOptionIndex = null

    const q = this.questions.questions[this.currentQuestionIndex % this.questions.questions.length]
    const options = q.options
    const laneCount = options.length
    const spacingX = 2.5
    const totalWidth = (laneCount - 1) * spacingX
    const startX = -totalWidth / 2
    // Place boxes well before the obstacle to give player time
    const zPos = obstacle.max.z + this.optionSpawnPlayerSideOffsetFromObstacle
    const yPos = this.isFlyingMode
      ? this.trackSurfaceY + (this.flightAltitude - 1.0)
      : this.trackSurfaceY + this.optionVerticalOffset

    for (let i = 0; i < laneCount; i++) {
      const geo = new THREE.BoxGeometry(1.6, 0.8, 1.6)
      const mat = new THREE.MeshStandardMaterial({
        color: 0x6666ff,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        depthTest: false
      }) // semi-transparent to pass through visually
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(startX + i * spacingX + this.optionHorizontalOffset, yPos, zPos)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
      this.optionBoxes.push({ mesh, optionIndex: i })

      // Create text label sprite for this option
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 128
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 44px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const labelText = String(options[i])
        // Wrap text if too long
        const maxWidth = canvas.width - 40
        const words = labelText.split(' ')
        let line = ''
        const lines: string[] = []
        for (const w of words) {
          const test = line.length ? line + ' ' + w : w
          if (ctx.measureText(test).width > maxWidth) {
            lines.push(line)
            line = w
          } else {
            line = test
          }
        }
        if (line) lines.push(line)
        const lineHeight = 50
        const totalHeight = lines.length * lineHeight
        let y = canvas.height / 2 - totalHeight / 2 + lineHeight / 2
        for (const l of lines) {
          ctx.fillText(l, canvas.width / 2, y)
          y += lineHeight
        }
      }
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
      })
      const sprite = new THREE.Sprite(material)
      const labelPos = mesh.position.clone()
      labelPos.y += 1.1
      sprite.position.copy(labelPos)
      sprite.scale.set(2.5, 0.75, 1)
      sprite.renderOrder = 998
      this.scene.add(sprite)
      this.optionLabels.push(sprite)
    }

    // Update HUD question text
    this.updateHudSprite()
  }

  // Fallback spawner: place option boxes a fixed distance ahead of the runner on the center lanes
  private spawnOptionBoxesAheadOfRunner(): void {
    if (!this.scene || !this.questions || this.questions.questions.length === 0) return
    // Clear any previous
    this.clearOptionBoxes()
    this.selectedOptionIndex = null

    const q = this.questions.questions[this.currentQuestionIndex % this.questions.questions.length]
    const options = q.options
    const laneCount = options.length
    const spacingX = 2.5
    const totalWidth = (laneCount - 1) * spacingX
    const startX = -totalWidth / 2
    // Character runs toward -Z, so spawn further negative from character position
    const zPos = this.characterPosition - this.optionSpawnAheadDistance
    const yPos = this.isFlyingMode
      ? this.trackSurfaceY + (this.flightAltitude - 1.0)
      : this.trackSurfaceY + this.optionVerticalOffset

    for (let i = 0; i < laneCount; i++) {
      const geo = new THREE.BoxGeometry(1.8, 0.9, 1.8)
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3a86ff,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        depthTest: false
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(startX + i * spacingX + this.optionHorizontalOffset, yPos, zPos)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
      this.optionBoxes.push({ mesh, optionIndex: i })

      // Create text label sprite for this option
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 128
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 44px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const labelText = String(options[i])
        const maxWidth = canvas.width - 40
        const words = labelText.split(' ')
        let line = ''
        const lines: string[] = []
        for (const w of words) {
          const test = line.length ? line + ' ' + w : w
          if (ctx.measureText(test).width > maxWidth) {
            lines.push(line)
            line = w
          } else {
            line = test
          }
        }
        if (line) lines.push(line)
        const lineHeight = 50
        const totalHeight = lines.length * lineHeight
        let y = canvas.height / 2 - totalHeight / 2 + lineHeight / 2
        for (const l of lines) {
          ctx.fillText(l, canvas.width / 2, y)
          y += lineHeight
        }
      }
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
      })
      const sprite = new THREE.Sprite(material)
      const labelPos = mesh.position.clone()
      labelPos.y += 1.1
      sprite.position.copy(labelPos)
      sprite.scale.set(2.5, 0.75, 1)
      sprite.renderOrder = 998
      this.scene.add(sprite)
      this.optionLabels.push(sprite)
    }

    // Update HUD question text
    this.updateHudSprite()
    // Debug
    console.log('Spawned option boxes ahead of runner at z:', zPos)
  }

  private clearOptionBoxes(): void {
    if (!this.scene) return
    for (const opt of this.optionBoxes) {
      this.scene.remove(opt.mesh)
      opt.mesh.geometry.dispose()
      if (Array.isArray(opt.mesh.material)) {
        opt.mesh.material.forEach((m) => m.dispose())
      } else {
        opt.mesh.material.dispose()
      }
    }
    this.optionBoxes = []
    // Clear labels
    for (const label of this.optionLabels) {
      this.scene.remove(label)
      const mat = label.material as THREE.SpriteMaterial
      if (mat.map) mat.map.dispose()
      mat.dispose()
    }
    this.optionLabels = []
  }

  private handleOptionSelected(optionIndex: number): void {
    if (!this.questions || this.questions.questions.length === 0) return
    this.selectedOptionIndex = optionIndex
    // Color selected option blue immediately
    const selected = this.optionBoxes.find((o) => o.optionIndex === optionIndex)
    if (selected) {
      const mat = selected.mesh.material as THREE.MeshStandardMaterial
      mat.color.setHex(0x3366ff)
    }

    // Check correctness and color selected (and correct one) accordingly
    const q = this.questions.questions[this.currentQuestionIndex % this.questions.questions.length]
    const correct = q.answer

    // After a short delay, show green for correct selection (or red wrong, green correct)
    setTimeout(() => {
      for (const opt of this.optionBoxes) {
        const mat = opt.mesh.material as THREE.MeshStandardMaterial
        if (opt.optionIndex === correct) {
          mat.color.setHex(0x00aa00) // green
        } else if (opt.optionIndex === optionIndex) {
          mat.color.setHex(0xaa0000) // red for wrong selection
        } else {
          mat.color.setHex(0x555555) // dim others
        }
      }
    }, 150)

    // If wrong answer, play a falling animation sequence (if preloaded) and delay advancing
    if (optionIndex !== correct) {
      this.playFailSequence(() => {
        this.finishQuestion(false)
      })
    } else {
      // Advance to next question and clear options after a short pause (correct only)
      setTimeout(() => {
        this.finishQuestion(true)
      }, 1200)
    }
  }
  
  private finishQuestion(isCorrect: boolean): void {
    if (this.quizComplete) return
    this.questionsAnswered += 1
    if (isCorrect) this.correctAnswers += 1
    const remaining = this.totalQuestions - this.questionsAnswered
    if (remaining <= 0) {
      this.endQuizAndShowResults()
      return
    }
    // Advance to next
    this.currentQuestionIndex = (this.currentQuestionIndex + 1) % (this.questions!.questions.length)
    this.updateHudSprite()
    this.clearOptionBoxes()
    this.activeObstacleIndex = -1
    this.selectedOptionIndex = null
  }

  // Play falling -> falling flat sequence, then restore flying loop
  private playFailSequence(onDone?: () => void): void {
    if (!this.scene || this.isPlayingFailSequence) return
    if (!this.fallingFBX && !this.fallingFlatFBX) return
    this.isPlayingFailSequence = true
    // Create blinking "Wrong Answer" overlay
    if (!this.wrongSprite && this.scene) {
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 300
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#ff3333'
        ctx.font = 'bold 84px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('WRONG ANSWER', canvas.width / 2, canvas.height / 2 - 50)
        // Show correct answer on second line if available
        try {
          const hasQ = !!this.questions && this.questions.questions.length > 0
          if (hasQ) {
            const q = this.questions!.questions[this.currentQuestionIndex % this.questions!.questions.length]
            const correctIndex = q.answer
            const correctText = q.options?.[correctIndex]
            if (correctText) {
              ctx.fillStyle = '#ffffff'
              ctx.font = 'bold 48px sans-serif'
              ctx.fillText(`Correct Answer: ${String(correctText)}`, canvas.width / 2, canvas.height / 2 + 40)
            }
          }
        } catch {}
      }
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
      })
      this.wrongSprite = new THREE.Sprite(material)
      this.wrongSprite.center.set(0.5, 0.5)
      this.wrongSprite.renderOrder = 1000
      this.scene.add(this.wrongSprite)
      this.wrongStartMs = performance.now()
    }

    const restoreFlying = () => {
      if (!this.scene) return
      if (this.characterModel && this.characterModel.parent === this.scene) {
        this.scene.remove(this.characterModel)
      }
      if (this.flyingFBX) {
        // Place the flying model at last known position/orientation
        const pos = this.characterModel?.position.clone() || new THREE.Vector3(0, this.trackSurfaceY + this.flightAltitude, 0)
        const rotY = this.characterModel?.rotation.y || Math.PI
        this.flyingFBX.position.copy(pos)
        this.flyingFBX.rotation.y = rotY
        this.characterModel = this.flyingFBX
        this.scene.add(this.characterModel)
        // Resume loop animation
        const clips = (this.flyingFBX as any).animations as THREE.AnimationClip[] | undefined
        if (clips && clips.length > 0) {
          this.animationMixer = new AnimationMixer(this.characterModel)
          const clip = clips[0]
          this.currentAction = this.animationMixer.clipAction(clip)
          this.currentAction.enabled = true
          this.currentAction.setEffectiveWeight(1.0)
          this.currentAction.setLoop(THREE.LoopRepeat, Infinity)
          this.currentAction.clampWhenFinished = false
          this.currentAction.timeScale = 1.0
          this.currentAction.play()
        }
      }
      this.isPlayingFailSequence = false
      // Remove blinking overlay
      if (this.wrongSprite) {
        const ms = this.wrongSprite.material as THREE.SpriteMaterial
        if (ms.map) ms.map.dispose()
        ms.dispose()
        this.scene.remove(this.wrongSprite)
        this.wrongSprite = null
      }
      if (onDone) onDone()
    }

    const switchTo = (model: THREE.Group | null): number => {
      if (!model || !this.scene) return 0
      // Remove current character
      if (this.characterModel && this.characterModel.parent === this.scene) {
        // Keep last positions
        model.position.copy(this.characterModel.position)
        model.rotation.copy(this.characterModel.rotation)
        this.scene.remove(this.characterModel)
      }
      this.characterModel = model
      this.scene.add(this.characterModel)
      // Play the first animation once
      const clips = (model as any).animations as THREE.AnimationClip[] | undefined
      if (clips && clips.length > 0) {
        this.animationMixer = new AnimationMixer(this.characterModel)
        const clip = clips[0]
        this.currentAction = this.animationMixer.clipAction(clip)
        this.currentAction.enabled = true
        this.currentAction.setEffectiveWeight(1.0)
        this.currentAction.setLoop(THREE.LoopOnce, 1)
        this.currentAction.clampWhenFinished = true
        this.currentAction.timeScale = 1.0
        this.currentAction.reset().play()
        return clip.duration ? clip.duration * 1000 : 1200
      }
      return 800
    }

    // Sequence: Falling -> Flat Impact -> restore
    const d1 = switchTo(this.fallingFBX)
    // Play falling SFX at start of fall
    if (this.fallingSfx) {
      try { this.fallingSfx.currentTime = 0; this.fallingSfx.play().catch(() => {}) } catch {}
    } else {
      try { const a = new Audio('/falling.mp3'); SubwaySurfersGame.registerAudio(a); a.play().catch(() => {}) } catch {}
    }
    setTimeout(() => {
      const d2 = switchTo(this.fallingFlatFBX)
      // Play impact/dying SFX on flat impact
      if (this.dyingSfx) {
        try { this.dyingSfx.currentTime = 0; this.dyingSfx.play().catch(() => {}) } catch {}
      } else {
        try { const a = new Audio('/dying.mp3'); SubwaySurfersGame.registerAudio(a); a.play().catch(() => {}) } catch {}
      }
      // Begin camera dip during impact
      this.failCamAnim = {
        active: true,
        startMs: performance.now(),
        downDurationMs: Math.max(200, Math.min(800, d2 * 0.5)),
        upDurationMs: Math.max(300, Math.min(1000, d2 * 0.7)),
        heightDip: 6.0
      }
      setTimeout(() => {
        restoreFlying()
      }, Math.max(800, d2))
    }, Math.max(600, d1))
  }

  // Display a temporary "Round X starting" overlay and auto-remove after pause
  private showRoundOverlay(text: string): void {
    if (!this.scene) return
    // Dispose previous
    if (this.roundSprite) {
      const ms = this.roundSprite.material as THREE.SpriteMaterial
      if (ms.map) ms.map.dispose()
      ms.dispose()
      this.scene.remove(this.roundSprite)
      this.roundSprite = null
    }
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 220
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffcc00'
      ctx.font = 'bold 64px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    }
    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      opacity: 1.0
    })
    this.roundSprite = new THREE.Sprite(material)
    this.roundSprite.renderOrder = 1001
    this.scene.add(this.roundSprite)
  }

  private endQuizAndShowResults(): void {
    this.quizComplete = true
    // Halt gameplay
    this.setState({ ...this.getState(), isPaused: true, isGameOver: true })
    this.clearOptionBoxes()
    // Build results
    const durationMs = Math.max(0, performance.now() - this.quizStartedAtMs)
    const total = this.totalQuestions || (this.questions?.questions?.length || 0)
    const correct = this.correctAnswers
    const wrong = Math.max(0, total - correct)
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    const details = {
      totalQuestions: total,
      correctAnswers: correct,
      wrongAnswers: wrong,
      scorePercent: percentage,
      durationMs
    }
    // Print JSON to "terminal" (browser console)
    try {
      console.log('Quiz Results JSON:', JSON.stringify(details))
      console.table(details as any)
    } catch {}
    // Show simple DOM overlay with score and Play Again
    if (!this.resultEl) {
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.inset = '0'
      container.style.display = 'flex'
      container.style.alignItems = 'center'
      container.style.justifyContent = 'center'
      container.style.background = 'rgba(0,0,0,0.5)'
      container.style.zIndex = '10000'
      const panel = document.createElement('div')
      panel.style.padding = '24px'
      panel.style.borderRadius = '12px'
      panel.style.background = 'rgba(20,20,20,0.9)'
      panel.style.border = '1px solid rgba(255,255,255,0.15)'
      panel.style.color = '#fff'
      panel.style.minWidth = '300px'
      panel.style.textAlign = 'center'
      panel.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
      const h = document.createElement('div')
      h.textContent = 'Quiz Complete'
      h.style.fontSize = '22px'
      h.style.fontWeight = '800'
      h.style.marginBottom = '12px'
      const p = document.createElement('div')
      p.style.lineHeight = '1.6'
      p.innerHTML = `
        <div>Total: ${total}</div>
        <div>Correct: ${correct}</div>
        <div>Wrong: ${wrong}</div>
        <div>Score: ${percentage}%</div>
        <div>Time: ${(durationMs/1000).toFixed(1)}s</div>
      `
      const btn = document.createElement('button')
      btn.textContent = 'Play Again'
      btn.style.cursor = 'pointer'
      btn.style.marginTop = '16px'
      btn.style.padding = '10px 18px'
      btn.style.borderRadius = '10px'
      btn.style.border = '1px solid rgba(255,255,255,0.25)'
      btn.style.background = 'linear-gradient(180deg, #10b981, #059669)'
      btn.style.color = '#fff'
      btn.style.fontWeight = '700'
      btn.style.fontSize = '14px'
      btn.onclick = () => {
        try { (window as any).__nyuStopAllAudio?.() } catch {}
        try { this.bgAudio?.pause() } catch {}
        try { window.location.reload() } catch {}
      }
      panel.appendChild(h)
      panel.appendChild(p)
      panel.appendChild(btn)
      container.appendChild(panel)
      document.body.appendChild(container)
      this.resultEl = container
    }
    // Stop background audio
    try { this.bgAudio?.pause() } catch {}
  }
  // Menu overlay helpers
  private showStartMenu(): void {
    if (this.menuEl) return
    // Root container
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.inset = '0'
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'center'
    container.style.background = 'rgba(0,0,0,0.45)'
    container.style.backdropFilter = 'blur(2px)'
    container.style.zIndex = '9999'

    const panel = document.createElement('div')
    panel.style.maxWidth = '420px'
    panel.style.margin = '0 24px'
    panel.style.background = 'rgba(20,20,20,0.85)'
    panel.style.border = '1px solid rgba(255,255,255,0.2)'
    panel.style.borderRadius = '12px'
    panel.style.padding = '24px'
    panel.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)'
    panel.style.position = 'relative'

    const button = document.createElement('button')
    button.textContent = 'Start Game'
    button.style.cursor = 'pointer'
    button.style.padding = '12px 22px'
    button.style.borderRadius = '10px'
    button.style.border = '1px solid rgba(255,255,255,0.25)'
    button.style.background = 'linear-gradient(180deg, #3b82f6, #1d4ed8)'
    button.style.color = '#fff'
    button.style.fontWeight = '700'
    button.style.fontSize = '16px'
    button.style.display = 'block'
    button.style.margin = '0 auto'
    button.style.boxShadow = '0 6px 20px rgba(59,130,246,0.4)'

    button.onpointerdown = (e) => {
      e.preventDefault()
      e.stopPropagation()
      // Start on Easy
      this.gameSpeed = 1.0
      this.isMenuActive = false
      this.hideStartMenu()
    }

    panel.appendChild(button)
    container.appendChild(panel)
    document.body.appendChild(container)
    this.menuEl = container
  }

  private hideStartMenu(): void {
    if (this.menuEl) {
      try {
        document.body.removeChild(this.menuEl)
      } catch {}
      this.menuEl = null
    }
    // Remove temporary autoplay listeners if they still exist
    const noop = () => {}
    window.removeEventListener('pointerdown', noop as any)
    window.removeEventListener('keydown', noop as any)
  }

  private startBackgroundMusic(): void {
    try {
      const audio = new Audio('/bg-music.mp3')
      audio.loop = true
      audio.volume = 0.6
      SubwaySurfersGame.registerAudio(audio)
      // Try to play immediately; if blocked, start on first user interaction
      audio.play().catch(() => {
        const startOnInteract = () => {
          audio.play().catch(() => {})
          window.removeEventListener('pointerdown', startOnInteract)
          window.removeEventListener('keydown', startOnInteract)
        }
        window.addEventListener('pointerdown', startOnInteract, { once: true })
        window.addEventListener('keydown', startOnInteract, { once: true })
      })
      this.bgAudio = audio
      // Stop music when leaving or backgrounding the page
      this.bgOnVisibilityChange = () => {
        if (document.visibilityState === 'hidden' && this.bgAudio) {
          try { this.bgAudio.pause() } catch {}
        }
      }
      this.bgOnPageHide = () => {
        if (this.bgAudio) {
          try { this.bgAudio.pause(); this.bgAudio.currentTime = 0 } catch {}
        }
      }
      this.bgOnBeforeUnload = () => {
        if (this.bgAudio) {
          try { this.bgAudio.pause(); this.bgAudio.currentTime = 0 } catch {}
        }
      }
      document.addEventListener('visibilitychange', this.bgOnVisibilityChange)
      window.addEventListener('pagehide', this.bgOnPageHide)
      window.addEventListener('beforeunload', this.bgOnBeforeUnload)
    } catch {}
  }
  
  private preloadSfx(): void {
    try {
      const fall = new Audio('/falling.mp3')
      fall.preload = 'auto'
      fall.volume = 0.9
      SubwaySurfersGame.registerAudio(fall)
      this.fallingSfx = fall
    } catch {}
    try {
      const die = new Audio('/dying.mp3')
      die.preload = 'auto'
      die.volume = 0.9
      SubwaySurfersGame.registerAudio(die)
      this.dyingSfx = die
    } catch {}
  }

  handleInput(key: string): void {
    // Handle key press for left/right movement
    if (key === 'a' || key === 'A' || key === 'd' || key === 'D') {
      this.keysPressed.add(key.toLowerCase())
    }
  }
  
  // Method to handle key release (we'll need to call this from GameRenderer)
  handleKeyUp(key: string): void {
    if (key === 'a' || key === 'A' || key === 'd' || key === 'D') {
      this.keysPressed.delete(key.toLowerCase())
    }
  }

  cleanup(): void {
    // Clean up Three.js resources and event listeners
    const currentRenderer = this.renderer
    if (currentRenderer) {
      // Remove orbit/zoom listeners tied to this renderer's canvas
      if (typeof window !== 'undefined') {
        const canvas = currentRenderer.domElement
        canvas.removeEventListener('pointerdown', this.handlePointerDown)
        canvas.removeEventListener('pointermove', this.handlePointerMove)
        canvas.removeEventListener('wheel', this.handleWheel)
        window.removeEventListener('pointerup', this.handlePointerUp)
      }
      currentRenderer.dispose()
      this.renderer = null
    }
    // Stop background music if playing
    if (this.bgAudio) {
      try {
        this.bgAudio.pause()
        this.bgAudio.currentTime = 0
        // Unload the source to ensure no lingering playback
        this.bgAudio.src = ''
        this.bgAudio.load()
      } catch {}
      this.bgAudio = null
    }
    // Dispose HUD sprites
    if (this.hudSprite) {
      const mat = this.hudSprite.material as THREE.SpriteMaterial
      if (mat.map) mat.map.dispose()
      mat.dispose()
      if (this.scene) this.scene.remove(this.hudSprite)
      this.hudSprite = null
    }
    if (this.scoreSprite) {
      const mat = this.scoreSprite.material as THREE.SpriteMaterial
      if (mat.map) mat.map.dispose()
      mat.dispose()
      if (this.scene) this.scene.remove(this.scoreSprite)
      this.scoreSprite = null
    }
    // Remove bg music listeners
    if (this.bgOnVisibilityChange) {
      document.removeEventListener('visibilitychange', this.bgOnVisibilityChange)
      this.bgOnVisibilityChange = null
    }
    if (this.bgOnPageHide) {
      window.removeEventListener('pagehide', this.bgOnPageHide)
      this.bgOnPageHide = null
    }
    if (this.bgOnBeforeUnload) {
      window.removeEventListener('beforeunload', this.bgOnBeforeUnload)
      this.bgOnBeforeUnload = null
    }
    // Release SFX references
    this.fallingSfx = null
    this.dyingSfx = null
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
      this.scene = null
    }
    this.camera = null
    this.subwayModel = null
    this.characterModel = null
    this.animationMixer = null
    // Remove menu overlay/audio if present
    this.hideStartMenu()
  }

  getQuestions(): QuestionsData | null {
    return this.questions
  }
}
