import * as THREE from 'three'
import { SATQuestion, ZombieGameState } from './types'

interface Zombie {
  mesh: THREE.Group
  label: string
  speed: number
  isCorrect: boolean
  isDead: boolean
}

interface Bullet {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
}

export class ZombieGame {
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private zombies: Zombie[] = []
  private bullets: Bullet[] = []
  private currentQuestion: SATQuestion | null = null
  private gameState: ZombieGameState
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private collidableObjects: THREE.Mesh[] = []
  private crosshair!: THREE.Group
  private gun!: THREE.Group
  
  // Movement
  private keys: { [key: string]: boolean } = {}
  private velocity = new THREE.Vector3()
  private moveSpeed = 0.15
  
  // Mouse look - START FACING FORWARD (negative Z)
  private yaw = 0 // 0 = looking at -Z (forward where zombies are)
  private pitch = 0

  // Callbacks
  onScoreUpdate?: (score: number) => void
  onQuestionComplete?: (isCorrect: boolean) => void
  onGameOver?: (state: ZombieGameState) => void

  constructor(
    private canvas: HTMLCanvasElement,
    private questions: SATQuestion[]
  ) {
    this.gameState = {
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentQuestionIndex: 0,
      totalQuestions: questions.length,
      streak: 0,
      maxStreak: 0,
      ammo: 50,
      health: 100,
      isGameOver: false
    }

    this.init()
    this.setupEventListeners()
    this.animate()
  }

  private init(): void {
    // Scene - BRIGHT like a warehouse
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // Sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 30, 50)

    // Camera (FPS view)
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.canvas.width / this.canvas.height,
      0.1,
      1000
    )
    this.camera.position.set(0, 1.6, 8) // Eye level height, start at front
    // Camera rotation will be controlled by yaw/pitch in updateCamera()

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true 
    })
    this.renderer.setSize(this.canvas.width, this.canvas.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // SUPER BRIGHT LIGHTING - Like daytime warehouse
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5) // Very bright white
    this.scene.add(ambientLight)

    // Hemisphere light for natural look
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0)
    hemiLight.position.set(0, 20, 0)
    this.scene.add(hemiLight)

    // Main directional light (like sun through window)
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0)
    sunLight.position.set(5, 10, 5)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    this.scene.add(sunLight)

    // Additional overhead lights for even coverage
    const mainLight1 = new THREE.PointLight(0xffffff, 2.0, 30)
    mainLight1.position.set(0, 4.5, 0)
    this.scene.add(mainLight1)

    const mainLight2 = new THREE.PointLight(0xffffff, 2.0, 30)
    mainLight2.position.set(-8, 4.5, -8)
    this.scene.add(mainLight2)

    const mainLight3 = new THREE.PointLight(0xffffff, 2.0, 30)
    mainLight3.position.set(8, 4.5, -8)
    this.scene.add(mainLight3)

    const mainLight4 = new THREE.PointLight(0xffffff, 2.0, 30)
    mainLight4.position.set(0, 4.5, 8)
    this.scene.add(mainLight4)

    // Create creepy room
    this.createCreepyRoom()
    
    // Add camera to scene
    this.scene.add(this.camera)
    
    // Create 3D crosshair that shows where bullets go
    this.createCrosshair()
    
    // Create gun
    this.createGun()
  }
  
  private createGun(): void {
    this.gun = new THREE.Group()
    
    // Gun body
    const bodyGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.5)
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.2
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    this.gun.add(body)
    
    // Gun barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8)
    const barrelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.1
    })
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.1, -0.4)
    this.gun.add(barrel)
    
    // Gun handle
    const handleGeometry = new THREE.BoxGeometry(0.1, 0.25, 0.15)
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3a2a1a,
      roughness: 0.8
    })
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    handle.position.set(0, -0.25, 0.1)
    handle.rotation.x = -0.3
    this.gun.add(handle)
    
    // Position gun on RIGHT side
    this.gun.position.set(0.3, -0.3, -0.5)
    this.gun.rotation.y = -0.1
    this.camera.add(this.gun)
  }
  
  private createCrosshair(): void {
    this.crosshair = new THREE.Group()
    
    // Red dot in center
    const dotGeometry = new THREE.CircleGeometry(0.01, 16)
    const dotMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      side: THREE.DoubleSide
    })
    const dot = new THREE.Mesh(dotGeometry, dotMaterial)
    this.crosshair.add(dot)
    
    // Crosshair lines
    const lineLength = 0.03
    const lineThickness = 0.003
    const lineGeometry = new THREE.PlaneGeometry(lineLength, lineThickness)
    const lineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      side: THREE.DoubleSide
    })
    
    // Horizontal line
    const hLine = new THREE.Mesh(lineGeometry, lineMaterial)
    this.crosshair.add(hLine)
    
    // Vertical line
    const vLine = new THREE.Mesh(lineGeometry.clone(), lineMaterial)
    vLine.rotation.z = Math.PI / 2
    this.crosshair.add(vLine)
    
    // Position crosshair in front of camera
    this.crosshair.position.set(0, 0, -2)
    this.camera.add(this.crosshair)
  }

  private createCreepyRoom(): void {
    // Floor - Light gray concrete
    const floorGeometry = new THREE.PlaneGeometry(30, 30)
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xaaaaaa, // Light gray
      roughness: 0.7,
      metalness: 0.1
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    // Walls - Light brick/concrete
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b7355, // Light brown brick
      roughness: 0.8
    })

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(30, 5, 0.5),
      wallMaterial
    )
    backWall.position.set(0, 2.5, -15)
    backWall.receiveShadow = true
    backWall.castShadow = true
    this.scene.add(backWall)
    this.collidableObjects.push(backWall)

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 5, 30),
      wallMaterial
    )
    leftWall.position.set(-15, 2.5, 0)
    leftWall.receiveShadow = true
    leftWall.castShadow = true
    this.scene.add(leftWall)
    this.collidableObjects.push(leftWall)

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 5, 30),
      wallMaterial
    )
    rightWall.position.set(15, 2.5, 0)
    rightWall.receiveShadow = true
    rightWall.castShadow = true
    this.scene.add(rightWall)
    this.collidableObjects.push(rightWall)

    // Front wall (with openings so you can see out)
    const frontWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(8, 5, 0.5),
      wallMaterial
    )
    frontWallLeft.position.set(-11, 2.5, 15)
    frontWallLeft.receiveShadow = true
    frontWallLeft.castShadow = true
    this.scene.add(frontWallLeft)
    this.collidableObjects.push(frontWallLeft)

    const frontWallRight = new THREE.Mesh(
      new THREE.BoxGeometry(8, 5, 0.5),
      wallMaterial
    )
    frontWallRight.position.set(11, 2.5, 15)
    frontWallRight.receiveShadow = true
    frontWallRight.castShadow = true
    this.scene.add(frontWallRight)
    this.collidableObjects.push(frontWallRight)

    const frontWallTop = new THREE.Mesh(
      new THREE.BoxGeometry(14, 2, 0.5),
      wallMaterial
    )
    frontWallTop.position.set(0, 4, 15)
    frontWallTop.receiveShadow = true
    frontWallTop.castShadow = true
    this.scene.add(frontWallTop)
    this.collidableObjects.push(frontWallTop)

    // Ceiling - Light gray
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, // Light gray ceiling
        roughness: 0.9
      })
    )
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = 5
    ceiling.receiveShadow = true
    this.scene.add(ceiling)

    // Add wooden crates and boxes - BRIGHT colors
    const boxPositions = [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 },
      { x: -12, z: 0 },
      { x: 12, z: 0 },
      { x: 0, z: -12 },
      { x: 5, z: -8 },
      { x: -5, z: -8 },
      { x: 8, z: 5 },
      { x: -8, z: 5 },
    ]

    boxPositions.forEach(pos => {
      const boxSize = Math.random() * 1 + 1.5
      const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize)
      const boxMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xd2691e, // Bright chocolate brown
        roughness: 0.7,
        metalness: 0.1
      })
      const box = new THREE.Mesh(boxGeometry, boxMaterial)
      box.position.set(pos.x, boxSize / 2, pos.z)
      box.rotation.y = Math.random() * Math.PI
      box.castShadow = true
      box.receiveShadow = true
      this.scene.add(box)
      this.collidableObjects.push(box)

      // Add label/warning stickers on some boxes
      if (Math.random() > 0.5) {
        const labelGeometry = new THREE.PlaneGeometry(0.5, 0.5)
        const labelMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000
        })
        const label = new THREE.Mesh(labelGeometry, labelMaterial)
        label.position.set(pos.x, boxSize, pos.z)
        label.rotation.x = -Math.PI / 2
        this.scene.add(label)
      }
    })

    // Add metal barrels - BRIGHT
    for (let i = 0; i < 4; i++) {
      const barrelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16)
      const barrelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888, // Light gray metal
        roughness: 0.4,
        metalness: 0.9
      })
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
      
      const positions = [
        { x: -8, z: -12 },
        { x: 8, z: -12 },
        { x: -12, z: 8 },
        { x: 12, z: 8 }
      ]
      
      barrel.position.set(positions[i].x, 0.75, positions[i].z)
      barrel.castShadow = true
      barrel.receiveShadow = true
      this.scene.add(barrel)
      this.collidableObjects.push(barrel)
    }

    // Warning signs on walls - BRIGHT
    const signMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
    })
    
    const sign1 = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), signMaterial)
    sign1.position.set(-10, 3, -14.8)
    this.scene.add(sign1)

    const sign2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), signMaterial)
    sign2.position.set(10, 3, -14.8)
    this.scene.add(sign2)
  }

  // No gun - bullets come from center crosshair

  public spawnZombies(question: SATQuestion): void {
    this.currentQuestion = question
    this.clearZombies()

    const labels = ['A', 'B', 'C', 'D']
    const positions = [
      { x: -6, z: -12 },
      { x: -2, z: -13 },
      { x: 2, z: -13 },
      { x: 6, z: -12 }
    ]

    for (let i = 0; i < 4; i++) {
      const zombie = this.createZombie(labels[i], i === question.correctAnswer)
      zombie.mesh.position.set(
        positions[i].x,
        0,
        positions[i].z
      )
      zombie.speed = 0.015 + Math.random() * 0.01
      this.zombies.push(zombie)
      this.scene.add(zombie.mesh)
    }
  }

  private createZombie(label: string, isCorrect: boolean): Zombie {
    const zombieGroup = new THREE.Group()

    // Body - ALL SAME COLOR (no cheating!)
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.6)
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x5a6a5a, // Gray-green - same for all zombies
      roughness: 0.8,
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1
    body.castShadow = true
    zombieGroup.add(body)

    // Head - BRIGHT
    const headGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7)
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8a9a8a, // Light gray-green
      roughness: 0.8
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = 2.4
    head.castShadow = true
    zombieGroup.add(head)

    // Glowing eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8)
    const eyeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
    })
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.2, 2.5, 0.35)
    zombieGroup.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.2, 2.5, 0.35)
    zombieGroup.add(rightEye)

    // Add eye lights
    const eyeLight1 = new THREE.PointLight(0xff0000, 0.5, 3)
    eyeLight1.position.copy(leftEye.position)
    zombieGroup.add(eyeLight1)

    const eyeLight2 = new THREE.PointLight(0xff0000, 0.5, 3)
    eyeLight2.position.copy(rightEye.position)
    zombieGroup.add(eyeLight2)

    // Arms reaching forward - BRIGHT
    const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3)
    const armMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8a9a8a, // Light gray-green
      roughness: 0.8
    })
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial)
    leftArm.position.set(-0.65, 1.3, 0.3)
    leftArm.rotation.x = -Math.PI / 3
    leftArm.castShadow = true
    zombieGroup.add(leftArm)

    const rightArm = new THREE.Mesh(armGeometry, armMaterial)
    rightArm.position.set(0.65, 1.3, 0.3)
    rightArm.rotation.x = -Math.PI / 3
    rightArm.castShadow = true
    zombieGroup.add(rightArm)

    // Label above head - ALL SAME COLOR (no hints!)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 256
    canvas.height = 256
    context.fillStyle = '#ffffff' // White for all labels
    context.font = 'bold 120px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label, 128, 128)

    const labelTexture = new THREE.CanvasTexture(canvas)
    const labelMaterial = new THREE.SpriteMaterial({ 
      map: labelTexture,
      transparent: true
    })
    const labelSprite = new THREE.Sprite(labelMaterial)
    labelSprite.position.y = 3.5
    labelSprite.scale.set(1.5, 1.5, 1)
    zombieGroup.add(labelSprite)

    // FORCE disable frustum culling on EVERYTHING
    zombieGroup.frustumCulled = false
    body.frustumCulled = false
    head.frustumCulled = false
    leftEye.frustumCulled = false
    rightEye.frustumCulled = false
    leftArm.frustumCulled = false
    rightArm.frustumCulled = false
    labelSprite.frustumCulled = false
    
    // Also traverse to be sure
    zombieGroup.traverse((child) => {
      child.frustumCulled = false
      if (child instanceof THREE.Mesh || child instanceof THREE.Sprite) {
        child.frustumCulled = false
      }
    })

    return {
      mesh: zombieGroup,
      label,
      speed: 0.02,
      isCorrect,
      isDead: false
    }
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('click', this.handleShoot.bind(this))
    
    // Movement controls
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true
      if (e.key === ' ') e.preventDefault() // Prevent page scroll
    })
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false
    })

    // Pointer lock for better FPS controls
    this.canvas.addEventListener('click', () => {
      this.canvas.requestPointerLock()
    })
  }

  private handleMouseMove(event: MouseEvent): void {
    if (document.pointerLockElement === this.canvas) {
      // Mouse look when locked (FPS controls)
      const sensitivity = 0.002
      
      // Yaw (left/right rotation around Y axis)
      this.yaw -= event.movementX * sensitivity
      
      // Pitch (up/down rotation around X axis)
      this.pitch -= event.movementY * sensitivity
      
      // Clamp pitch to prevent flipping upside down
      this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch))
    } else {
      // Regular aiming (for shooting without pointer lock)
      const rect = this.canvas.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
  }

  private updateCamera(): void {
    // Apply yaw and pitch to camera rotation (Euler order: YXZ)
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.yaw
    this.camera.rotation.x = this.pitch
    this.camera.rotation.z = 0 // No roll
    
    // Update matrix after rotation change
    this.camera.updateMatrixWorld()
  }

  private handleShoot(): void {
    if (this.gameState.isGameOver || this.gameState.ammo <= 0) return

    this.gameState.ammo--

    // Gun recoil
    const originalZ = this.gun.position.z
    this.gun.position.z = originalZ + 0.1
    setTimeout(() => {
      this.gun.position.z = originalZ
    }, 100)

    // Muzzle flash from gun barrel
    const flashGeometry = new THREE.SphereGeometry(0.15, 8, 8)
    const flashMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00
    })
    const flash = new THREE.Mesh(flashGeometry, flashMaterial)
    flash.position.set(0.3, -0.15, -0.8)
    this.camera.add(flash)
    setTimeout(() => this.camera.remove(flash), 50)

    // Shoot in the EXACT direction the camera is facing
    const shootDirection = new THREE.Vector3(0, 0, -1)
    shootDirection.applyQuaternion(this.camera.quaternion)
    shootDirection.normalize()
    
    console.log('Shoot Direction:', shootDirection)
    
    // Create BIGGER bullet so you can see it
    const bulletGeometry = new THREE.SphereGeometry(0.15, 8, 8)
    const bulletMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000 // RED so it's visible
    })
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial)
    
    // Start from camera center
    bulletMesh.position.copy(this.camera.position)
    bulletMesh.position.add(shootDirection.clone().multiplyScalar(0.5))
    
    this.bullets.push({
      mesh: bulletMesh,
      velocity: shootDirection.clone().multiplyScalar(2.0)
    })
    this.scene.add(bulletMesh)
    
    setTimeout(() => {
      this.scene.remove(bulletMesh)
      this.bullets = this.bullets.filter(b => b.mesh !== bulletMesh)
    }, 1000)
    
    // Check hits using SAME direction as bullet
    this.raycaster.set(this.camera.position, shootDirection)
    
    // Collect all zombie objects for raycasting
    const zombieMeshes: THREE.Object3D[] = []
    for (const zombie of this.zombies) {
      if (!zombie.isDead && zombie.mesh.parent) {
        // Only add if zombie is in the scene
        zombie.mesh.updateMatrixWorld(true)
        // Add all children meshes for better hit detection
        zombie.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.matrixWorld) {
            zombieMeshes.push(child)
          }
        })
      }
    }

    // Only raycast if we have valid objects
    if (zombieMeshes.length === 0) return

    const intersects = this.raycaster.intersectObjects(zombieMeshes, false)

    if (intersects.length > 0) {
      // Find which zombie was hit
      const hitObject = intersects[0].object
      for (const zombie of this.zombies) {
        if (!zombie.isDead) {
          // Check if hit object is part of this zombie
          let isHit = false
          zombie.mesh.traverse((child) => {
            if (child === hitObject) {
              isHit = true
            }
          })
          if (isHit) {
            this.hitZombie(zombie)
            break
          }
        }
      }
    }
  }

  private hitZombie(zombie: Zombie): void {
    if (zombie.isDead) return

    zombie.isDead = true
    this.createBloodEffect(zombie.mesh.position)

    // Death animation
    const fallInterval = setInterval(() => {
      zombie.mesh.rotation.x += 0.05
      zombie.mesh.position.y -= 0.05
      
      if (zombie.mesh.position.y <= -2) {
        clearInterval(fallInterval)
        this.scene.remove(zombie.mesh)
      }
    }, 30)

    this.handleAnswer(zombie.isCorrect)
  }

  private createBloodEffect(position: THREE.Vector3): void {
    const particleCount = 30
    const particles: THREE.Mesh[] = []

    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4)
      const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x8b0000 })
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      
      particle.position.copy(position)
      particle.position.y += 1
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      )
      
      ;(particle as any).velocity = velocity
      particles.push(particle)
      this.scene.add(particle)
    }

    let time = 0
    const particleAnimation = setInterval(() => {
      time += 0.05
      for (const particle of particles) {
        const velocity = (particle as any).velocity as THREE.Vector3
        particle.position.add(velocity)
        velocity.y -= 0.02
        particle.scale.multiplyScalar(0.95)
      }
      
      if (time > 1) {
        clearInterval(particleAnimation)
        particles.forEach(p => this.scene.remove(p))
      }
    }, 30)
  }

  private handleAnswer(isCorrect: boolean): void {
    if (isCorrect) {
      this.gameState.score += 100
      this.gameState.correctAnswers++
      this.gameState.streak++
      this.gameState.maxStreak = Math.max(this.gameState.maxStreak, this.gameState.streak)
      this.gameState.ammo += 10
    } else {
      this.gameState.wrongAnswers++
      this.gameState.streak = 0
      this.gameState.health -= 25
      
      if (this.gameState.health <= 0) {
        this.endGame()
        return
      }
    }

    this.onScoreUpdate?.(this.gameState.score)
    this.onQuestionComplete?.(isCorrect)

    setTimeout(() => {
      this.nextQuestion()
    }, 1500)
  }

  private nextQuestion(): void {
    this.gameState.currentQuestionIndex++
    
    if (this.gameState.currentQuestionIndex >= this.questions.length) {
      this.endGame()
    }
  }

  private clearZombies(): void {
    for (const zombie of this.zombies) {
      this.scene.remove(zombie.mesh)
    }
    this.zombies = []
  }

  private endGame(): void {
    this.gameState.isGameOver = true
    this.onGameOver?.(this.gameState)
  }

  private checkCollision(newPosition: THREE.Vector3): boolean {
    // Check collision with all objects
    const playerRadius = 0.5
    
    for (const obj of this.collidableObjects) {
      const box = new THREE.Box3().setFromObject(obj)
      
      // Expand box by player radius
      box.min.x -= playerRadius
      box.min.z -= playerRadius
      box.max.x += playerRadius
      box.max.z += playerRadius
      
      // Check if new position is inside the box (at player height)
      if (newPosition.x >= box.min.x && newPosition.x <= box.max.x &&
          newPosition.z >= box.min.z && newPosition.z <= box.max.z) {
        return true // Collision detected
      }
    }
    
    return false // No collision
  }

  private updateMovement(): void {
    // Calculate movement direction DIRECTLY from yaw (not quaternion)
    const moveDirection = new THREE.Vector3()
    
    // Forward/backward (W/S) - use yaw only (ignore pitch)
    if (this.keys['w']) {
      moveDirection.x += -Math.sin(this.yaw)
      moveDirection.z += -Math.cos(this.yaw)
    }
    if (this.keys['s']) {
      moveDirection.x += Math.sin(this.yaw)
      moveDirection.z += Math.cos(this.yaw)
    }
    
    // Strafe left/right (A/D)
    if (this.keys['a']) {
      moveDirection.x += -Math.cos(this.yaw)
      moveDirection.z += Math.sin(this.yaw)
    }
    if (this.keys['d']) {
      moveDirection.x += Math.cos(this.yaw)
      moveDirection.z += -Math.sin(this.yaw)
    }

    // Normalize to prevent faster diagonal movement
    if (moveDirection.length() > 0) {
      moveDirection.normalize()
      moveDirection.multiplyScalar(this.moveSpeed)
      
      // Calculate new position
      const newPosition = this.camera.position.clone().add(moveDirection)
      
      // Check collision before moving
      if (!this.checkCollision(newPosition)) {
        this.camera.position.copy(newPosition)
      } else {
        // Try sliding along walls (X and Z separately)
        const newPosX = this.camera.position.clone()
        newPosX.x += moveDirection.x
        if (!this.checkCollision(newPosX)) {
          this.camera.position.x = newPosX.x
        }
        
        const newPosZ = this.camera.position.clone()
        newPosZ.z += moveDirection.z
        if (!this.checkCollision(newPosZ)) {
          this.camera.position.z = newPosZ.z
        }
      }
    }

    // Clamp to room bounds
    this.camera.position.x = Math.max(-14, Math.min(14, this.camera.position.x))
    this.camera.position.z = Math.max(-14, Math.min(14, this.camera.position.z))
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate)

    // Update camera rotation from mouse
    this.updateCamera()

    // Update movement
    this.updateMovement()

    // Move zombies toward player
    for (const zombie of this.zombies) {
      if (zombie.isDead) continue

      // Calculate direction to player
      const direction = new THREE.Vector3()
      direction.subVectors(this.camera.position, zombie.mesh.position)
      direction.y = 0
      direction.normalize()

      // Move zombie
      zombie.mesh.position.add(direction.multiplyScalar(zombie.speed))

      // Look at player
      zombie.mesh.lookAt(this.camera.position.x, zombie.mesh.position.y, this.camera.position.z)

      // FORCE update zombie matrix so it's always visible
      zombie.mesh.updateMatrixWorld(true)

      // Zombie reached player
      const distance = zombie.mesh.position.distanceTo(this.camera.position)
      if (distance < 2 && !zombie.isCorrect) {
        this.gameState.health = 0
        this.endGame()
        return
      }

      // Swaying animation
      zombie.mesh.rotation.z = Math.sin(Date.now() * 0.003) * 0.1
    }

    // Move bullets
    for (const bullet of this.bullets) {
      bullet.mesh.position.add(bullet.velocity)
    }

    // Gun idle sway
    if (this.gun) {
      this.gun.rotation.x = Math.sin(Date.now() * 0.001) * 0.005
      this.gun.rotation.y = -0.1 + Math.cos(Date.now() * 0.001) * 0.01
    }

    this.renderer.render(this.scene, this.camera)
  }

  public getCurrentQuestion(): SATQuestion | null {
    return this.currentQuestion
  }

  public getGameState(): ZombieGameState {
    return { ...this.gameState }
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  public dispose(): void {
    this.renderer.dispose()
    this.scene.clear()
    window.removeEventListener('keydown', this.keys as any)
    window.removeEventListener('keyup', this.keys as any)
  }
}
