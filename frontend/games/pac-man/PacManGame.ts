import { BaseGame } from '../BaseGame';
import * as THREE from 'three';

interface SAT_Question {
  question: string
  options: string[]
  correct: number
  category: 'math' | 'reading' | 'writing'
}

interface Ghost {
  mesh: THREE.Mesh
  position: { x: number; z: number }
  direction: { x: number; z: number }
  color: number
  speed: number
}

interface PowerPellet {
  mesh: THREE.Mesh
  position: { x: number; z: number }
  active: boolean
}

/**
 * Pac-Man SAT Study Game
 * Navigate the maze, collect dots, avoid ghosts, and answer SAT questions!
 */
export class PacManGame extends BaseGame {
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private pacman!: THREE.Mesh
  private ghosts: Ghost[] = []
  private dots: THREE.Mesh[] = []
  private powerPellets: PowerPellet[] = []
  private walls: THREE.Mesh[] = []
  
  private pacmanPos = { x: 0, z: 0 }
  private pacmanDir = { x: 0, z: 0 }
  private nextDir = { x: 0, z: 0 }
  private moveSpeed = 0.1
  private powerMode = false
  private powerModeTimer = 0
  
  private maze: number[][] = []
  private cellSize = 2
  private dotsCollected = 0
  private totalDots = 0
  
  private currentQuestion: SAT_Question | null = null
  private questionTimer = 0
  private showQuestion = false
  private questionCooldown = 0
  
  private satQuestions: SAT_Question[] = [
    {
      question: "If 2x + 5 = 13, what is x?",
      options: ["2", "4", "6", "8"],
      correct: 1,
      category: 'math'
    },
    {
      question: "What is 15% of 200?",
      options: ["25", "30", "35", "40"],
      correct: 1,
      category: 'math'
    },
    {
      question: "Which word is most similar to 'ephemeral'?",
      options: ["eternal", "temporary", "solid", "beautiful"],
      correct: 1,
      category: 'reading'
    },
    {
      question: "If a = 3b and b = 4, what is a?",
      options: ["7", "12", "16", "20"],
      correct: 1,
      category: 'math'
    },
    {
      question: "Which sentence is grammatically correct?",
      options: ["Me and him went", "Him and I went", "He and I went", "I and he went"],
      correct: 2,
      category: 'writing'
    },
    {
      question: "Solve: (x + 2)² = 16. What are the values of x?",
      options: ["2, -6", "4, -8", "2, -2", "4, 0"],
      correct: 0,
      category: 'math'
    },
    {
      question: "'Ameliorate' most nearly means:",
      options: ["worsen", "improve", "maintain", "destroy"],
      correct: 1,
      category: 'reading'
    },
    {
      question: "If f(x) = 2x - 3, what is f(5)?",
      options: ["7", "8", "10", "13"],
      correct: 0,
      category: 'math'
    }
  ]

  init(): void {
    console.log('PacMan init called with dimensions:', this.width, 'x', this.height);
    console.log('Canvas passed to constructor:', this.canvas);
    console.log('THREE object:', THREE);
    console.log('THREE.WebGLRenderer:', THREE.WebGLRenderer);
    
    if (!this.canvas) {
      console.error('Canvas not found!');
      return;
    }

    // Create WebGL renderer using the canvas from constructor
    try {
      this.renderer = new THREE.WebGLRenderer({ 
        canvas: this.canvas, 
        antialias: true,
        alpha: false
      });
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      
      console.log('Renderer created successfully');
    } catch (error) {
      console.error('Error creating renderer:', error);
      console.error('THREE.WebGLRenderer type:', typeof THREE.WebGLRenderer);
      return;
    }

    // Create scene and camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    
    // Position camera to look down at the maze from above
    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 35, 0);
    this.camera.lookAt(0, 0, 0);
    
    console.log('PacMan: Scene initialized', {
      width: this.width,
      height: this.height,
      camera: this.camera.position
    });
    
    // Lighting - make it brighter
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(0, 20, 0);
    this.scene.add(directionalLight);
    
    // Add a helper light
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(hemisphereLight);
    
    // Add ground plane to make sure something is visible
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x0a0a0a,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    this.scene.add(ground);
    
    console.log('Lighting and ground added');
    
    // Create maze
    this.generateMaze();
    this.createMazeWalls();
    
    // Create Pac-Man
    const pacmanGeometry = new THREE.SphereGeometry(0.6, 32, 32, 0, Math.PI * 1.5);
    const pacmanMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffff00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3
    });
    this.pacman = new THREE.Mesh(pacmanGeometry, pacmanMaterial);
    this.pacman.position.set(this.pacmanPos.x, 0.6, this.pacmanPos.z);
    this.scene.add(this.pacman);
    
    console.log('Pacman created at:', this.pacmanPos);
    
    // Create ghosts
    this.createGhosts();
    
    // Create dots and power pellets
    this.createDots();
    
    this.setState({ 
      score: 0, 
      level: 1, 
      lives: 3, 
      isPaused: false, 
      isGameOver: false 
    });
  }

  private generateMaze(): void {
    // Classic Pac-Man style maze (simplified)
    this.maze = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,1,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,1,1,1,0,1,0,0,0,1,0,1,1,1,1],
      [1,0,0,0,0,1,0,1,0,1,0,0,0,0,1],
      [1,0,1,1,0,0,0,1,0,0,0,1,1,0,1],
      [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,0,1,1,0,1,1,1,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
    
    // Set initial Pac-Man position
    this.pacmanPos = { 
      x: (-this.maze[0].length / 2 + 1) * this.cellSize, 
      z: (-this.maze.length / 2 + 1) * this.cellSize 
    }
  }

  private createMazeWalls(): void {
    const wallGeometry = new THREE.BoxGeometry(this.cellSize, 2, this.cellSize)
    const wallMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2196f3,
      emissive: 0x1565c0,
      emissiveIntensity: 0.2
    })
    
    const startX = -this.maze[0].length / 2 * this.cellSize
    const startZ = -this.maze.length / 2 * this.cellSize
    
    console.log('Creating walls at:', { startX, startZ })
    
    for (let row = 0; row < this.maze.length; row++) {
      for (let col = 0; col < this.maze[row].length; col++) {
        if (this.maze[row][col] === 1) {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial)
          wall.position.set(
            startX + col * this.cellSize,
            1,
            startZ + row * this.cellSize
          )
          this.walls.push(wall)
          this.scene.add(wall)
        }
      }
    }
    
    console.log(`Created ${this.walls.length} walls`)
  }

  private createGhosts(): void {
    const ghostColors = [0xff0000, 0xffb8ff, 0x00ffff, 0xffb851]
    
    ghostColors.forEach((color, i) => {
      const ghostGeometry = new THREE.SphereGeometry(0.6, 16, 16)
      const ghostMaterial = new THREE.MeshPhongMaterial({ color })
      const ghostMesh = new THREE.Mesh(ghostGeometry, ghostMaterial)
      
      const pos = this.getRandomEmptyPosition()
      ghostMesh.position.set(pos.x, 0.6, pos.z)
      
      const ghost: Ghost = {
        mesh: ghostMesh,
        position: pos,
        direction: { x: 1, z: 0 },
        color,
        speed: 0.05 + i * 0.01
      }
      
      this.ghosts.push(ghost)
      this.scene.add(ghostMesh)
    })
  }

  private createDots(): void {
    const dotGeometry = new THREE.SphereGeometry(0.15, 8, 8)
    const dotMaterial = new THREE.MeshPhongMaterial({ color: 0xffff88 })
    const powerPelletGeometry = new THREE.SphereGeometry(0.35, 8, 8)
    const powerPelletMaterial = new THREE.MeshPhongMaterial({ color: 0xff88ff })
    
    const startX = -this.maze[0].length / 2 * this.cellSize
    const startZ = -this.maze.length / 2 * this.cellSize
    
    for (let row = 0; row < this.maze.length; row++) {
      for (let col = 0; col < this.maze[row].length; col++) {
        if (this.maze[row][col] === 0) {
          const x = startX + col * this.cellSize
          const z = startZ + row * this.cellSize
          
          // Power pellets in corners
          if ((row === 1 && col === 1) || (row === 1 && col === this.maze[0].length - 2) ||
              (row === this.maze.length - 2 && col === 1) || 
              (row === this.maze.length - 2 && col === this.maze[0].length - 2)) {
            const pellet = new THREE.Mesh(powerPelletGeometry, powerPelletMaterial)
            pellet.position.set(x, 0.35, z)
            this.powerPellets.push({ mesh: pellet, position: { x, z }, active: true })
            this.scene.add(pellet)
          } else {
            const dot = new THREE.Mesh(dotGeometry, dotMaterial)
            dot.position.set(x, 0.15, z)
            this.dots.push(dot)
            this.scene.add(dot)
            this.totalDots++
          }
        }
      }
    }
  }

  private getRandomEmptyPosition(): { x: number; z: number } {
    const startX = -this.maze[0].length / 2 * this.cellSize
    const startZ = -this.maze.length / 2 * this.cellSize
    
    while (true) {
      const row = Math.floor(Math.random() * this.maze.length)
      const col = Math.floor(Math.random() * this.maze[0].length)
      
      if (this.maze[row][col] === 0) {
        return {
          x: startX + col * this.cellSize,
          z: startZ + row * this.cellSize
        }
      }
    }
  }

  update(deltaTime: number): void {
    if (this.state.isPaused || this.state.isGameOver) return
    if (!this.pacman || !this.scene) return // Safety check
    
    // Update question timer
    if (this.showQuestion) {
      this.questionTimer += deltaTime
      if (this.questionTimer > 10000) { // 10 seconds to answer
        this.showQuestion = false
        this.currentQuestion = null
        this.setState({ lives: this.state.lives - 1 })
        if (this.state.lives <= 0) {
          this.setState({ isGameOver: true })
        }
      }
      return // Pause game during question
    }
    
    if (this.questionCooldown > 0) {
      this.questionCooldown -= deltaTime
    }
    
    // Update power mode
    if (this.powerMode) {
      this.powerModeTimer -= deltaTime
      if (this.powerModeTimer <= 0) {
        this.powerMode = false
        this.ghosts.forEach(ghost => {
          (ghost.mesh.material as THREE.MeshPhongMaterial).color.setHex(ghost.color)
        })
      }
    }
    
    // Move Pac-Man
    this.movePacman()
    
    // Check dot collection
    this.checkDotCollection()
    
    // Move ghosts
    this.moveGhosts()
    
    // Check collisions
    this.checkGhostCollision()
    
    // Animate Pac-Man mouth
    this.pacman.rotation.y += deltaTime * 0.005
  }

  private movePacman(): void {
    if (!this.pacman) return // Safety check
    
    // Try to change direction
    if (this.nextDir.x !== 0 || this.nextDir.z !== 0) {
      const newX = this.pacmanPos.x + this.nextDir.x * this.moveSpeed
      const newZ = this.pacmanPos.z + this.nextDir.z * this.moveSpeed
      
      if (!this.isWall(newX, newZ)) {
        this.pacmanDir = { ...this.nextDir }
      }
    }
    
    // Move in current direction
    if (this.pacmanDir.x !== 0 || this.pacmanDir.z !== 0) {
      const newX = this.pacmanPos.x + this.pacmanDir.x * this.moveSpeed
      const newZ = this.pacmanPos.z + this.pacmanDir.z * this.moveSpeed
      
      if (!this.isWall(newX, newZ)) {
        this.pacmanPos.x = newX
        this.pacmanPos.z = newZ
        this.pacman.position.set(this.pacmanPos.x, 0.6, this.pacmanPos.z)
        
        // Update rotation
        if (this.pacmanDir.x > 0) this.pacman.rotation.z = Math.PI
        else if (this.pacmanDir.x < 0) this.pacman.rotation.z = 0
        else if (this.pacmanDir.z > 0) this.pacman.rotation.z = Math.PI / 2
        else if (this.pacmanDir.z < 0) this.pacman.rotation.z = -Math.PI / 2
      }
    }
  }

  private isWall(x: number, z: number): boolean {
    const startX = -this.maze[0].length / 2 * this.cellSize
    const startZ = -this.maze.length / 2 * this.cellSize
    
    const col = Math.round((x - startX) / this.cellSize)
    const row = Math.round((z - startZ) / this.cellSize)
    
    if (row < 0 || row >= this.maze.length || col < 0 || col >= this.maze[0].length) {
      return true
    }
    
    return this.maze[row][col] === 1
  }

  private checkDotCollection(): void {
    // Check dots
    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i]
      const dx = dot.position.x - this.pacmanPos.x
      const dz = dot.position.z - this.pacmanPos.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      
      if (dist < 0.8) {
        this.scene.remove(dot)
        this.dots.splice(i, 1)
        this.dotsCollected++
        this.setState({ score: this.state.score + 10 })
        
        // Trigger question every 10 dots
        if (this.dotsCollected % 10 === 0 && this.questionCooldown <= 0) {
          this.triggerQuestion()
        }
        
        // Check win condition
        if (this.dotsCollected === this.totalDots) {
          this.nextLevel()
        }
      }
    }
    
    // Check power pellets
    for (const pellet of this.powerPellets) {
      if (!pellet.active) continue
      
      const dx = pellet.position.x - this.pacmanPos.x
      const dz = pellet.position.z - this.pacmanPos.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      
      if (dist < 0.8) {
        this.scene.remove(pellet.mesh)
        pellet.active = false
        this.powerMode = true
        this.powerModeTimer = 8000
        this.setState({ score: this.state.score + 50 })
        
        // Change ghost colors
        this.ghosts.forEach(ghost => {
          (ghost.mesh.material as THREE.MeshPhongMaterial).color.setHex(0x0000ff)
        })
      }
    }
  }

  private moveGhosts(): void {
    this.ghosts.forEach(ghost => {
      // Simple AI: occasionally change direction
      if (Math.random() < 0.02) {
        const dirs = [
          { x: 1, z: 0 }, { x: -1, z: 0 },
          { x: 0, z: 1 }, { x: 0, z: -1 }
        ]
        ghost.direction = dirs[Math.floor(Math.random() * dirs.length)]
      }
      
      const newX = ghost.position.x + ghost.direction.x * ghost.speed
      const newZ = ghost.position.z + ghost.direction.z * ghost.speed
      
      if (!this.isWall(newX, newZ)) {
        ghost.position.x = newX
        ghost.position.z = newZ
        ghost.mesh.position.set(ghost.position.x, 0.6, ghost.position.z)
      } else {
        // Hit wall, change direction
        const dirs = [
          { x: 1, z: 0 }, { x: -1, z: 0 },
          { x: 0, z: 1 }, { x: 0, z: -1 }
        ]
        ghost.direction = dirs[Math.floor(Math.random() * dirs.length)]
      }
    })
  }

  private checkGhostCollision(): void {
    this.ghosts.forEach(ghost => {
      const dx = ghost.position.x - this.pacmanPos.x
      const dz = ghost.position.z - this.pacmanPos.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      
      if (dist < 1.2) {
        if (this.powerMode) {
          // Eat ghost
          ghost.position = this.getRandomEmptyPosition()
          ghost.mesh.position.set(ghost.position.x, 0.6, ghost.position.z)
          this.setState({ score: this.state.score + 200 })
        } else {
          // Lose life
          this.setState({ lives: this.state.lives - 1 })
          this.resetPositions()
          if (this.state.lives <= 0) {
            this.setState({ isGameOver: true })
          }
        }
      }
    })
  }

  private triggerQuestion(): void {
    this.currentQuestion = this.satQuestions[Math.floor(Math.random() * this.satQuestions.length)]
    this.showQuestion = true
    this.questionTimer = 0
    this.questionCooldown = 5000
  }

  private answerQuestion(answerIndex: number): void {
    if (!this.currentQuestion) return
    
    if (answerIndex === this.currentQuestion.correct) {
      this.setState({ score: this.state.score + 100 })
      this.powerMode = true
      this.powerModeTimer = 5000
      this.ghosts.forEach(ghost => {
        (ghost.mesh.material as THREE.MeshPhongMaterial).color.setHex(0x0000ff)
      })
    } else {
      this.setState({ lives: this.state.lives - 1 })
      if (this.state.lives <= 0) {
        this.setState({ isGameOver: true })
      }
    }
    
    this.showQuestion = false
    this.currentQuestion = null
  }

  private resetPositions(): void {
    if (!this.pacman) return // Safety check
    
    this.pacmanPos = { 
      x: (-this.maze[0].length / 2 + 1) * this.cellSize, 
      z: (-this.maze.length / 2 + 1) * this.cellSize 
    }
    this.pacman.position.set(this.pacmanPos.x, 0.6, this.pacmanPos.z)
    this.pacmanDir = { x: 0, z: 0 }
    this.nextDir = { x: 0, z: 0 }
    
    this.ghosts.forEach(ghost => {
      const pos = this.getRandomEmptyPosition()
      ghost.position = pos
      ghost.mesh.position.set(pos.x, 0.6, pos.z)
    })
  }

  private nextLevel(): void {
    this.setState({ level: this.state.level + 1 })
    this.dotsCollected = 0
    
    // Recreate dots
    this.dots.forEach(dot => this.scene.remove(dot))
    this.dots = []
    this.totalDots = 0
    this.createDots()
    
    // Reset power pellets
    this.powerPellets.forEach(pellet => {
      if (!pellet.active) {
        pellet.active = true
        this.scene.add(pellet.mesh)
      }
    })
    
    // Reset positions
    this.resetPositions()
    
    // Increase ghost speed
    this.ghosts.forEach(ghost => {
      ghost.speed += 0.01
    })
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render Three.js scene FIRST
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera)
    }
    
    // Now overlay UI on top of the WebGL canvas
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, this.width, 80)
    
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 24px Arial'
    ctx.fillText(`Score: ${this.state.score}`, 20, 30)
    ctx.fillText(`Lives: ${'❤️'.repeat(this.state.lives)}`, 20, 60)
    ctx.fillText(`Level: ${this.state.level}`, this.width - 150, 30)
    
    if (this.powerMode) {
      ctx.fillStyle = '#ff88ff'
      ctx.fillText('POWER MODE!', this.width - 200, 60)
    }
    
    // Question overlay
    if (this.showQuestion && this.currentQuestion) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
      ctx.fillRect(50, this.height / 2 - 150, this.width - 100, 300)
      
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 20px Arial'
      ctx.fillText('SAT QUESTION!', this.width / 2 - 80, this.height / 2 - 100)
      
      ctx.font = '18px Arial'
      const words = this.currentQuestion.question.split(' ')
      let line = ''
      let y = this.height / 2 - 60
      
      words.forEach(word => {
        const testLine = line + word + ' '
        if (ctx.measureText(testLine).width > this.width - 150) {
          ctx.fillText(line, this.width / 2 - ctx.measureText(line).width / 2, y)
          line = word + ' '
          y += 25
        } else {
          line = testLine
        }
      })
      ctx.fillText(line, this.width / 2 - ctx.measureText(line).width / 2, y)
      
      // Options
      ctx.font = 'bold 16px Arial'
      this.currentQuestion.options.forEach((option, i) => {
        const optionY = this.height / 2 + i * 35
        ctx.fillStyle = '#4a9eff'
        ctx.fillRect(this.width / 2 - 200, optionY, 400, 30)
        ctx.fillStyle = '#fff'
        ctx.fillText(`${i + 1}. ${option}`, this.width / 2 - 180, optionY + 22)
      })
      
      ctx.fillStyle = '#ff0'
      ctx.font = '14px Arial'
      const timeLeft = Math.ceil((10000 - this.questionTimer) / 1000)
      ctx.fillText(`Time: ${timeLeft}s`, this.width / 2 - 40, this.height / 2 + 170)
    }
    
    // Game Over
    if (this.state.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(0, 0, this.width, this.height)
      
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 48px Arial'
      ctx.fillText('GAME OVER', this.width / 2 - 150, this.height / 2 - 40)
      ctx.font = '24px Arial'
      ctx.fillText(`Final Score: ${this.state.score}`, this.width / 2 - 100, this.height / 2 + 20)
      ctx.font = '18px Arial'
      ctx.fillText('Press R to Restart', this.width / 2 - 90, this.height / 2 + 60)
    }
    
    ctx.restore()
  }

  handleInput(key: string): void {
    if (this.state.isGameOver && key.toLowerCase() === 'r') {
      this.cleanup()
      this.init()
      return
    }
    
    // Answer questions with number keys
    if (this.showQuestion && ['1', '2', '3', '4'].includes(key)) {
      this.answerQuestion(parseInt(key) - 1)
      return
    }
    
    // Movement
    switch (key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        this.nextDir = { x: 0, z: -1 }
        break
      case 'arrowdown':
      case 's':
        this.nextDir = { x: 0, z: 1 }
        break
      case 'arrowleft':
      case 'a':
        this.nextDir = { x: -1, z: 0 }
        break
      case 'arrowright':
      case 'd':
        this.nextDir = { x: 1, z: 0 }
        break
      case ' ':
        this.setState({ isPaused: !this.state.isPaused })
        break
    }
  }

  cleanup(): void {
    // Clean up Three.js resources
    if (this.scene) {
      this.scene.traverse((object: THREE.Object3D): void => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose()
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        }
      })
    }
    
    if (this.renderer) {
      this.renderer.dispose()
    }
    
    // Clear arrays
    this.ghosts = []
    this.dots = []
    this.powerPellets = []
    this.walls = []
  }
}