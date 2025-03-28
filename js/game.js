import { Player } from './player.js';
import { CONFIG } from './config.js';
import { Hunter } from './hunter.js';

export class Game {
    constructor() {
        console.log('Initializing game...');
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        console.log('Canvas found, dimensions:', this.canvas.width, this.canvas.height);
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Could not get 2D context!');
            return;
        }
        console.log('2D context obtained successfully');
        
        // Initialize canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Set up key listeners
        this.setupControls();
        
        // Set up mouse listeners for attacks
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                if (this.showUpgradeMenu) {
                    this.handleUpgradeClick(e.clientX - this.canvas.getBoundingClientRect().left,
                                         e.clientY - this.canvas.getBoundingClientRect().top);
                } else {
                    this.startAttack(); // Use our controlled attack method instead
                }
            }
        });

        // Initialize game state
        this.isRunning = false;
        this.isPaused = false;
        this.showUpgradeMenu = false;
        this.showShopMenu = false;
        this.showHealMenu = false;
        this.hasMedStation = false;
        this.selectedShopItem = 0;
        this.player = null;
        this.animationProgress = 0;
        this.lastFrameTime = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.selectedUpgrade = 0;
        this.lastAttackTime = 0;
        this.isAttackAnimating = false;
        this.questionMarkTime = 0;
        this.boxAnimationActive = false;
        this.boxAnimationProgress = 0;
        this.groundDiamonds = [];
        this.collectedDiamonds = 0;
        this.hearts = 3;
        this.berryCount = 5; // Set initial berry count to 5
        this.lastBerrySpawn = 0;
        this.fireAnimationFrame = 0;
        this.fireAnimationTime = 0;

        // Initialize power-up properties
        this.magnetDropChance = 0.2; // Increased to 20% chance to drop magnet
        this.doubleRangeDropChance = 0.2; // Increased to 20% chance to drop double range
        this.magnetDuration = 10000; // 10 seconds duration
        this.doubleRangeDuration = 10000; // 10 seconds duration
        this.magnetLastPickup = 0;
        this.doubleRangeLastPickup = 0;
        this.magnetAnimationTime = 0;
        this.doubleRangeAnimationTime = 0;

        // Initialize arrays
        this.hunters = [];
        this.berries = [];
        this.leaves = [];
        this.magnets = [];
        this.doubleRanges = [];
        this.trees = [];

        // Initialize upgrades
        this.upgrades = [
            { name: 'Attack Speed', cost: 5, level: 1, maxLevel: 10 },
            { name: 'Movement Speed', cost: 5, level: 1, maxLevel: 10 },
            { name: 'Health', cost: 10, level: 1, maxLevel: 10 },
            { name: 'Attack Damage', cost: 8, level: 1, maxLevel: 10 }
        ];

        // Initialize game statistics
        this.gameStats = {
            huntersEliminated: 0,
            totalBerriesCollected: 0,
            wavesCompleted: 0
        };

        // Initialize wave management
        this.currentWave = 0;
        this.waveInProgress = false;
        this.lastHunterSpawn = 0;
        this.huntersToSpawn = 0;
        this.hunterSpawnInterval = 5000;
        this.waveStartTime = 0;

        // Initialize wave announcement properties
        this.showWaveAnnouncement = false;
        this.waveAnnouncementTime = 0;
        this.waveAnnouncementDuration = 5000;

        // Initialize screen shake
        this.screenShake = {
            intensity: 0,
            duration: 0,
            startTime: 0,
            offsetX: 0,
            offsetY: 0
        };

        // Initialize player stats
        this.stats = {
            attackSpeed: { level: 1, value: 1.0, cost: 5, baseValue: 1.0 },
            moveSpeed: { level: 1, value: 1.0, cost: 5, baseValue: 1.0 },  // Set to 1.0 to show as base speed in UI
            health: { level: 1, value: 3, cost: 10, baseValue: 3 },
            attackDamage: { level: 1, value: 10, cost: 8, baseValue: 10 }
        };

        // Load images
        this.berryImage = new Image();
        this.berryImage.src = './assets/redberry.png';
        this.berryImageLoaded = false;
        this.berryImage.onload = () => {
            this.berryImageLoaded = true;
            console.log('Berry image loaded successfully');
        };

        // Initialize portals
        this.portals = [
            { x: 0, y: 0, rotation: 0, textRotation: 0, unlocked: false, cost: 1 }
        ];
        this.portalsEnabled = false;

        // Load background image
        this.usernameBackground = new Image();
        this.usernameBackground.src = './assets/bearishNamePageBG.png';

        // Initialize shop items
        this.shopItems = [
            { name: 'Restore Hearts', cost: 5, purchased: false, description: 'Restores all missing hearts' }
        ];
        this.shopUnlocked = false; // Add property to track if shop is unlocked

        console.log('Game initialization complete');

        // Initialize berry swapper properties
        this.berrySwapperRotation = 0;
        this.berrySwapperPosition = {
            x: this.canvas.width/2 - 200,
            y: this.canvas.height/2 + 150
        };
        this.berrySwapperSize = 60;
        this.berrySwapperRange = 100;
        this.berrySwapperRotationSpeed = 0.02;
        this.blueberryImage = new Image();
        this.blueberryImage.src = './assets/blueberry.png';
        this.berrySwapRate = 10; // 10 red berries = 1 blueberry
        this.blueberryCount = 0; // Add blueberry counter
        
        // Add blueberry animation properties
        this.blueberryAnimationActive = false;
        this.blueberryAnimationProgress = 0;
        this.blueberryAnimationDuration = 1000; // 1 second animation
        this.blueberryAnimationStartTime = 0;

        this.groundItems = []; // Array to store items on the ground
    }

    resizeCanvas() {
        console.log('Resizing canvas...');
        // Set canvas size to match window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        console.log('Canvas resized to:', this.canvas.width, this.canvas.height);
        
        // Update CONFIG with new dimensions
        CONFIG.canvas.width = this.canvas.width;
        CONFIG.canvas.height = this.canvas.height;
        console.log('CONFIG updated with new dimensions');
        
        this.generateTrees();
    }

    generateTrees() {
        this.trees = [];
        const numTrees = 15; // Reduced number of trees
        const minDistance = 150; // Increased minimum distance between trees
        const maxDistance = 500; // Increased maximum distance
        const structureSafeDistance = 50; // Safe distance from structures
        
        // Define structure positions
        const structures = [
            { x: this.canvas.width/2 - 25, y: this.canvas.height/2, type: 'campfire' },           // Campfire (slightly left of center)
            { x: this.canvas.width/2 + 200, y: this.canvas.height/2, type: 'workbench' },         // Workbench (right of center)
            { x: this.canvas.width/2 - 200, y: this.canvas.height/2 - 150, type: 'shop' },        // Shop (left and up from center)
            { x: this.canvas.width/2 + 200, y: this.canvas.height/2 - 150, type: 'hospital' },    // Hospital (right and up from center)
            { x: this.canvas.width/2, y: this.canvas.height/2 + 150, type: 'mysterybox' }         // Mystery box (down from center)
        ];
        
        for (let i = 0; i < numTrees; i++) {
            let x, y;
            let validPosition = false;
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!validPosition && attempts < maxAttempts) {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;
                
                // Check distance from center
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                const distanceFromCenter = Math.sqrt(
                    Math.pow(x - centerX, 2) + 
                    Math.pow(y - centerY, 2)
                );
                
                // Check distance from other trees
                let tooClose = false;
                for (const tree of this.trees) {
                    const distance = Math.sqrt(
                        Math.pow(x - tree.x, 2) + 
                        Math.pow(y - tree.y, 2)
                    );
                    if (distance < minDistance) {
                        tooClose = true;
                        break;
                    }
                }
                
                // Check distance from structures
                if (distanceFromCenter >= minDistance && 
                    distanceFromCenter <= maxDistance && 
                    !tooClose) {
                    validPosition = true;
                }
            }
            
            // Varied tree sizes
            if (validPosition) {
                // 25% bigger tree sizes (25-44 pixels)
                const size = 25 + Math.random() * 19;
                this.trees.push({ 
                    x, 
                    y, 
                    size,
                    leafColors: [
                        '#2E7D32', // Dark green
                        '#388E3C', // Medium green
                        '#43A047', // Light green
                        '#66BB6A'  // Very light green
                    ],
                    lastLeafSpawn: Date.now() + Math.random() * 5000 // Random initial spawn time
                });
            }
        }
    }

    spawnLeaves() {
        const now = Date.now();
        const maxLeaves = 40; // Reduced maximum number of leaves
        
        // Remove old leaves
        this.leaves = this.leaves.filter(leaf => leaf.y < this.canvas.height + 50);
        
        // Spawn new leaves from trees
        this.trees.forEach(tree => {
            if (now - tree.lastLeafSpawn > 3000 && this.leaves.length < maxLeaves) { // Spawn every 3 seconds
                const leafCount = 1; // Only spawn 1 leaf at a time
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * tree.size / 2;
                const x = tree.x + Math.cos(angle) * distance;
                const y = tree.y - tree.size/2 + Math.sin(angle) * distance;
                
                this.leaves.push({
                    x,
                    y,
                    size: 3 + Math.random() * 2, // Smaller leaves to match smaller trees
                    speedX: (Math.random() - 0.5) * 0.3, // Reduced horizontal movement
                    speedY: 0.3 + Math.random() * 0.3, // Slower falling speed
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.01, // Slower rotation
                    color: tree.leafColors[Math.floor(Math.random() * tree.leafColors.length)],
                    opacity: 0.8 // Slightly transparent leaves
                });
                
                tree.lastLeafSpawn = now;
            }
        });
    }

    drawBerry(x, y, size, isBlueberry = false) {
        if (this.berryImageLoaded) {
            // Draw the berry image
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(this.berryRotation);
            this.ctx.scale(size / 30, size / 30);
            
            // Apply blue tint for blueberries
            if (isBlueberry) {
                this.ctx.filter = 'hue-rotate(240deg)';
            }
            
            this.ctx.drawImage(this.berryImage, -15, -15, 30, 30);
            this.ctx.restore();
        } else {
            // Fallback to circle drawing
            this.ctx.beginPath();
            this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            
            // Use blue color for blueberries
            if (isBlueberry) {
                this.ctx.fillStyle = '#4169E1'; // Royal blue
            } else {
                this.ctx.fillStyle = '#FF0000';
            }
            
            this.ctx.fill();
            this.ctx.strokeStyle = '#800000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    drawFire() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Position fire 25px to the left of center
        const fireX = centerX - 25;
        const fireY = centerY;
        
        // Only update animation if not in upgrade menu
        if (!this.showUpgradeMenu) {
            this.fireAnimationTime += 0.1;
            this.fireAnimationFrame = (this.fireAnimationFrame + 1) % 30;
        }
        
        // Draw logs
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(fireX - 20, fireY + 10, 40, 10);
        this.ctx.fillRect(fireX - 15, fireY + 5, 30, 10);
        
        // Draw fire
        const gradient = this.ctx.createRadialGradient(
            fireX, fireY + 5,
            0,
            fireX, fireY + 5,
            20
        );
        
        gradient.addColorStop(0, 'rgba(255, 150, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        
        // Animate fire
        const flameHeight = 20 + Math.sin(this.fireAnimationTime) * 5;
        this.ctx.beginPath();
        this.ctx.moveTo(fireX - 15, fireY + 5);
        this.ctx.quadraticCurveTo(
            fireX, fireY + 5 - flameHeight,
            fireX + 15, fireY + 5
        );
        this.ctx.fill();
    }

    drawUI() {
        // Cache frequently used values
        const maxHearts = this.maxHealth;  // Use maxHealth instead of stats.health.value
        const minWidth = 360;
        const heartSpace = maxHearts * 60 + 40;
        const panelWidth = Math.max(minWidth, heartSpace);
        const panelHeight = 180;
        const panelX = 30;
        const panelY = 21;

        // Draw wood panel background with single operation
        this.ctx.fillStyle = '#8B4513';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Draw magnet UI if active
        if (this.hasMagnet) {
            this.drawMagnetUI(panelX + 20, panelY + panelHeight + 40);
        }

        // Draw hunter kill counter
        this.drawHunterKillCounter(panelX + panelWidth + 20, panelY + 120);
        
        // Draw double range UI if active
        if (this.hasDoubleRange) {
            this.drawDoubleRangeUI(panelX + 20, panelY + panelHeight + 20);
        }
        
        // Batch wood grain texture drawing
        this.ctx.fillStyle = 'rgba(90, 50, 10, 0.3)';
        const grainCount = Math.ceil(panelWidth / 50);
        for (let i = 0; i < grainCount; i++) {
            this.ctx.fillRect(panelX + i * 50, panelY, 2, panelHeight);
        }
        this.ctx.shadowBlur = 0;

        // Username row position (unchanged)
        const usernameY = panelY + 35;
        
        // Calculate UI icons row position (unchanged)
        const iconSize = 32;
        const containerHeight = iconSize + 45;
        const containerY = panelY + panelHeight - containerHeight/2 - 10;

        // Draw username
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '18px "Press Start 2P"';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.playerName, panelX + 20, usernameY);

        // Draw hearts row (outside and to the right of the panel)
        const scale = 2;
        const activeHeartColors = ['#ff0000', '#ff6666', '#cc0000'];
        const inactiveHeartColors = ['#666666', '#666666', '#444444'];
        const heartStartX = panelX + panelWidth + 20;
        const heartY = panelY + 35;

        for (let i = 0; i < this.maxHealth; i++) {
            const heartX = heartStartX + i * 40;
            const colors = i < this.playerHealth ? activeHeartColors : inactiveHeartColors;
            
            for (let c = 0; c < colors.length; c++) {
                this.ctx.fillStyle = colors[c];
                if (c === 0) {
                    this.drawHeartShape(heartX, heartY, scale);
                } else if (c === 1) {
                    this.drawHeartHighlights(heartX, heartY, scale);
                } else {
                    this.drawHeartShadows(heartX, heartY, scale);
                }
            }
        }

        // Draw berry counter (where hearts used to be)
        const berryX = panelX + 20;
        const berryY = usernameY + ((containerY - usernameY) / 2) - 35 + 5;
        const berryScale = 1.125;

        // Draw red berry icon using the loaded image
        if (this.berryImageLoaded) {
            const berrySize = 24; // Size for the UI berry icon
            this.ctx.drawImage(
                this.berryImage,
                berryX,
                berryY - berrySize/2,
                berrySize,
                berrySize
            );
        } else {
            // Fallback to original berry drawing if image hasn't loaded
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(berryX, berryY, 12*berryScale, 12*berryScale);
            this.ctx.fillRect(berryX - 4*berryScale, berryY + 4*berryScale, 4*berryScale, 6*berryScale);
            this.ctx.fillRect(berryX + 12*berryScale, berryY + 4*berryScale, 4*berryScale, 6*berryScale);
            this.ctx.fillRect(berryX + 4*berryScale, berryY - 4*berryScale, 4*berryScale, 4*berryScale);

            // Berry highlights
            this.ctx.fillStyle = '#ff6666';
            this.ctx.fillRect(berryX + 4*berryScale, berryY, 4*berryScale, 4*berryScale);
            this.ctx.fillRect(berryX, berryY + 4*berryScale, 4*berryScale, 4*berryScale);

            // Berry shadows
            this.ctx.fillStyle = '#cc0000';
            this.ctx.fillRect(berryX + 8*berryScale, berryY + 8*berryScale, 4*berryScale, 4*berryScale);
            this.ctx.fillRect(berryX + 4*berryScale, berryY + 12*berryScale, 4*berryScale, 4*berryScale);

            // Berry leaf
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(berryX + 2*berryScale, berryY - 8*berryScale, 8*berryScale, 4*berryScale);
            this.ctx.fillRect(berryX + 4*berryScale, berryY - 12*berryScale, 4*berryScale, 4*berryScale);
            this.ctx.fillRect(berryX, berryY - 10*berryScale, 4*berryScale, 2*berryScale);
            this.ctx.fillRect(berryX + 8*berryScale, berryY - 10*berryScale, 4*berryScale, 2*berryScale);
        }

        // Red berry count (25% smaller font)
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '14px "Press Start 2P"';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`× ${this.berryCount}`, berryX + 30, berryY + 8);

        // Draw blueberry counter next to red berry counter
        const blueberryX = berryX + 100; // Position blueberry counter 100px to the right of red berry counter
        if (this.blueberryImage.complete) {
            const blueberrySize = 24;
            this.ctx.drawImage(
                this.blueberryImage,
                blueberryX,
                berryY - blueberrySize/2,
                blueberrySize,
                blueberrySize
            );
        }

        // Blueberry count
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '14px "Press Start 2P"';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`× ${this.blueberryCount}`, blueberryX + 30, berryY + 8);

        // Draw diamond counter in the same row
        const diamondX = blueberryX + 100; // Position diamond counter 100px to the right of blueberry counter
        const diamondSize = 15;
        this.drawDiamond(diamondX, berryY, diamondSize);
        
        // Draw diamond count
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '14px "Press Start 2P"';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`× ${this.collectedDiamonds}`, diamondX + 25, berryY + 8);

        // Draw stat containers
        const containerWidth = 100;
        const containerSpacing = 10;
        const totalContainersWidth = containerWidth * 3 + containerSpacing * 2;
        const startX = panelX + (panelWidth - totalContainersWidth) / 2;

        // Batch draw containers
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < 3; i++) {
            const x = startX + i * (containerWidth + containerSpacing);
            this.ctx.fillRect(x, containerY - containerHeight/2, containerWidth, containerHeight);
        }

        // Draw icons and text efficiently
        this.ctx.textAlign = 'center';
        const iconY = containerY - containerHeight/4 - 5;
        const textY = containerY + containerHeight/2 - 12;
        const stats = [
            { value: `${(1/this.stats.attackSpeed.value).toFixed(1)}/s`, draw: this.drawAttackSpeedIcon.bind(this) },
            { value: `x${this.stats.moveSpeed.value.toFixed(1)}`, draw: this.drawMovementSpeedIcon.bind(this) },
            { value: `+${this.maxHealth - 3}`, draw: this.drawHealthIcon.bind(this) }  // Show number of additional hearts
        ];

        for (let i = 0; i < 3; i++) {
            const x = startX + i * (containerWidth + containerSpacing);
            const iconX = x + (containerWidth - iconSize) / 2;
            
            stats[i].draw(iconX, iconY, iconSize);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '14px "Press Start 2P"';
            const text = stats[i].value;
            const textWidth = this.ctx.measureText(text).width;
            
            if (textWidth > containerWidth - 20) {
                this.ctx.font = '12px "Press Start 2P"';
            }
            this.ctx.fillText(text, x + containerWidth/2, textY);
        }
    }

    purchaseShopItem() {
        if (this.extraLives < 3 && this.blueberryCount >= this.extraLivesCost) {
            this.blueberryCount -= this.extraLivesCost;
            this.extraLives++;
            this.playerHealth = this.maxHealth;  // Restore health to full
            this.hearts = this.maxHealth;  // Update hearts to match max health
            this.extraLivesCost *= 2;
            this.sounds.purchase.play();
            this.startScreenShake(20, 500);
        }
    }

    // Helper methods for heart drawing
    drawHeartShape(x, y, scale) {
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        this.ctx.fillRect(x + 3*scale, y, 3*scale, 3*scale);
        this.ctx.fillRect(x + 12*scale, y, 3*scale, 3*scale);
        this.ctx.fillRect(x, y + 3*scale, 9*scale, 3*scale);
        this.ctx.fillRect(x + 9*scale, y + 3*scale, 9*scale, 3*scale);
        this.ctx.fillRect(x + 3*scale, y + 6*scale, 12*scale, 3*scale);
        this.ctx.fillRect(x + 6*scale, y + 9*scale, 6*scale, 3*scale);
        this.ctx.fillRect(x + 9*scale, y + 12*scale, 3*scale, 3*scale);

        this.ctx.restore();
    }

    drawHeartHighlights(x, y, scale) {
        this.ctx.fillRect(x + 3*scale, y, 3*scale, 3*scale);
        this.ctx.fillRect(x, y + 3*scale, 3*scale, 3*scale);
    }

    drawHeartShadows(x, y, scale) {
        this.ctx.fillRect(x + 15*scale, y + 3*scale, 3*scale, 3*scale);
        this.ctx.fillRect(x + 9*scale, y + 12*scale, 3*scale, 3*scale);
    }

    drawAttackSpeedIcon(x, y, size) {
        // Timer icon in pixel art style
        this.ctx.fillStyle = '#FFE0B2';
        
        // Outer circle
        const pixels = [
            [1,0,1,1,1,0,1],
            [0,1,1,1,1,1,0],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [0,1,1,1,1,1,0],
            [1,0,1,1,1,0,1]
        ];
        
        const pixelSize = size / 8;
        const offsetX = x + size/2 - (pixels[0].length * pixelSize)/2;
        const offsetY = y + size/2 - (pixels.length * pixelSize)/2;
        
        // Draw pixel art circle
        pixels.forEach((row, i) => {
            row.forEach((pixel, j) => {
                if (pixel) {
                    this.ctx.fillRect(
                        offsetX + j * pixelSize,
                        offsetY + i * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
        
        // Clock hands
        this.ctx.fillRect(x + size/2 - pixelSize/2, y + size/2 - size/3, pixelSize, size/3); // Vertical
        this.ctx.fillRect(x + size/2, y + size/2 - pixelSize/2, size/3, pixelSize); // Horizontal
    }

    drawMovementSpeedIcon(x, y, size) {
        // Detailed pixel art shoe
        this.ctx.fillStyle = '#8B4513';
        
        const pixels = [
            [0,0,0,0,1,1,1,1,1,0],
            [0,0,0,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,0],
            [0,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,1,1]
        ];
        
        const pixelSize = size / 12;
        const offsetX = x + size/2 - (pixels[0].length * pixelSize)/2;
        const offsetY = y + size/2 - (pixels.length * pixelSize)/2;
        
        // Draw base shoe shape
        pixels.forEach((row, i) => {
            row.forEach((pixel, j) => {
                if (pixel) {
                    this.ctx.fillRect(
                        offsetX + j * pixelSize,
                        offsetY + i * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });

        // Add shoe details (lighter brown)
        this.ctx.fillStyle = '#A0522D';
        
        // Shoelace holes (3 pairs)
        for (let i = 0; i < 3; i++) {
            // Left hole
            this.ctx.fillRect(
                offsetX + 3 * pixelSize,
                offsetY + (2 + i) * pixelSize,
                pixelSize,
                pixelSize
            );
            // Right hole
            this.ctx.fillRect(
                offsetX + 5 * pixelSize,
                offsetY + (2 + i) * pixelSize,
                pixelSize,
                pixelSize
            );
        }

        // Shoelaces (crossing pattern)
        this.ctx.fillStyle = '#DEB887';
        for (let i = 0; i < 2; i++) {
            // Left to right lace
            this.ctx.fillRect(
                offsetX + (3 + i) * pixelSize,
                offsetY + (2.5 + i) * pixelSize,
                2 * pixelSize,
                pixelSize
            );
            // Right to left lace
            this.ctx.fillRect(
                offsetX + (3 + i) * pixelSize,
                offsetY + (3.5 + i) * pixelSize,
                2 * pixelSize,
                pixelSize
            );
        }

        // Sole detail (darker brown)
        this.ctx.fillStyle = '#5D4037';
        for (let i = 0; i < 2; i++) {
            this.ctx.fillRect(
                offsetX,
                offsetY + (6 + i) * pixelSize,
                10 * pixelSize,
                pixelSize
            );
        }
    }

    drawHealthIcon(x, y, size) {
        // Improved pixel art heart
        this.ctx.fillStyle = '#ff0000';
        
        const pixels = [
            [0,1,1,0,0,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,0,0],
            [0,0,0,1,1,0,0,0]
        ];
        
        const pixelSize = size / 10;
        const offsetX = x + size/2 - (pixels[0].length * pixelSize)/2;
        const offsetY = y + size/2 - (pixels.length * pixelSize)/2;
        
        // Draw pixel art heart
        pixels.forEach((row, i) => {
            row.forEach((pixel, j) => {
                if (pixel) {
                    this.ctx.fillRect(
                        offsetX + j * pixelSize,
                        offsetY + i * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
        
        // Plus symbol with more padding (white)
        this.ctx.fillStyle = '#ffffff';
        const plusSize = size * 0.2; // Smaller plus
        const plusPadding = size * 0.1; // More padding
        
        // Horizontal bar of plus
        this.ctx.fillRect(
            x + size/2 - plusSize/2,
            y + size/2 - plusSize/6 + plusPadding,
            plusSize,
            plusSize/3
        );
        
        // Vertical bar of plus
        this.ctx.fillRect(
            x + size/2 - plusSize/6,
            y + size/2 - plusSize/2 + plusPadding,
            plusSize/3,
            plusSize
        );
    }

    checkBerryCollection() {
        this.berries.forEach(berry => {
            if (!berry.collected) {
                const dx = this.player.x - berry.x;
                const dy = this.player.y - berry.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Increase collection radius by 10x if magnet is active
                const collectionRadius = this.hasMagnet ? 
                    (this.player.size/2 + berry.size/2) * 10 : 
                    this.player.size/2 + berry.size/2;

                // If magnet is active, add berry movement towards player
                if (this.hasMagnet && distance < collectionRadius) {
                    const speed = 5;
                    const angle = Math.atan2(dy, dx);
                    berry.x += Math.cos(angle) * speed;
                    berry.y += Math.sin(angle) * speed;
                }
                
                // Check for actual collection
                const newDx = this.player.x - berry.x;
                const newDy = this.player.y - berry.y;
                const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);
                
                if (newDistance < this.player.size/2 + berry.size/2) {
                    berry.collected = true;
                    this.berryCount++;
                    this.gameStats.totalBerriesCollected++;
                }
            }
        });
    }

    drawPortals() {
        const portalWidth = 120;  // Increased width for oval shape
        const portalHeight = 60;  // Kept height the same
        const cornerRadius = 10;
        
        if (!this.showUpgradeMenu) {
            this.portalAnimationTime = (this.portalAnimationTime || 0) + 0.02;
        }

        // Update portal position - moved down 50px from top
        this.portals[0].x = this.canvas.width/2;
        this.portals[0].y = 100;  // Changed from 50 to 100 (50px down from original)

        this.portals.forEach(portal => {
            this.ctx.save();
            this.ctx.translate(portal.x, portal.y);

            const gradientCenter = {
                x: Math.cos(this.portalAnimationTime * 2) * 10,
                y: Math.sin(this.portalAnimationTime * 2) * 10
            };

            // Draw the portal shape as a horizontal oval
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, portalWidth/2, portalHeight/2, 0, 0, Math.PI * 2);
            this.ctx.closePath();

            // Set portal color based on state - ALWAYS PURPLE if not unlocked
            const gradient = this.ctx.createRadialGradient(
                gradientCenter.x, gradientCenter.y, 0,
                gradientCenter.x, gradientCenter.y, portalWidth/2
            );

            const time = this.portalAnimationTime;
            if (portal.unlocked) {
                // Blue for unlocked portals
                gradient.addColorStop(0, '#66B2FF');
                gradient.addColorStop(Math.abs(Math.sin(time)), '#3399FF');
                gradient.addColorStop(1, '#0066CC');
            } else {
                // Purple for locked portals
                gradient.addColorStop(0, '#b366ff');
                gradient.addColorStop(Math.abs(Math.sin(time)), '#8000ff');
                gradient.addColorStop(1, '#4a0080');
            }

            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            // ALWAYS draw lock and price tag if portal is not unlocked and player is nearby
            const isNearPortal = this.isPlayerNearPortal(portal.x, portal.y);
            if (!portal.unlocked && isNearPortal) {
                this.ctx.rotate(portal.textRotation);
                
                // Draw lock at the top of the portal
                this.drawLock(0, -15);
                
                // Draw price tag centered in the portal - moved up slightly
                this.drawPortalPriceTag(0, 10, portal.cost);
                
                // Draw F button if player has enough diamonds - moved below price tag
                if (this.collectedDiamonds >= portal.cost) {
                    this.drawInteractButton(0, -40);
                }
            }
            
            this.ctx.restore();
        });
    }

    drawLock(x, y) {
        // Larger lock body 
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x - 12, y - 8, 24, 20);  // Increased from 16x13 to 24x20
        
        // Larger lock shackle
        this.ctx.beginPath();
        this.ctx.arc(x, y - 12, 9, Math.PI, 0, false);  // Increased radius from 6 to 9
        this.ctx.lineWidth = 4;  // Increased from 3 to 4
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.stroke();
        
        // Add shine effect
        const gradient = this.ctx.createLinearGradient(x - 12, y - 8, x + 12, y + 12);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - 12, y - 8, 24, 20);
    }

    drawPortalPriceTag(x, y, cost) {
        const hasEnoughDiamonds = this.collectedDiamonds >= cost;
        
        // Larger price tag background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 35, y - 10, 70, 20); // Increased width and height
        
        // Price tag border
        this.ctx.strokeStyle = hasEnoughDiamonds ? '#FFD700' : '#FFFFFF';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(x - 35, y - 10, 70, 20);
        
        // Larger price tag text
        this.ctx.fillStyle = hasEnoughDiamonds ? '#FFD700' : '#FFFFFF';
        this.ctx.font = '14px "Press Start 2P"'; // Increased from 8px to 14px
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Position text and diamond better
        this.ctx.fillText(cost.toString(), x - 10, y);
        
        // Draw diamond icon instead of berry
        this.drawDiamond(x + 16, y, 8); // Increased size from 4 to 8, moved further right
    }

    isPlayerNearPortal(portalX, portalY) {
        if (!this.player) return false;
        
        const dx = this.player.x - portalX;
        const dy = this.player.y - portalY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 120; // Keep the same interaction range
    }

    unlockNearestPortal() {
        if (!this.portalsEnabled) return;
        
        for (const portal of this.portals) {
            if (!portal.unlocked && this.isPlayerNearPortal(portal.x, portal.y)) {
                if (this.collectedDiamonds >= portal.cost) {  // Check diamonds instead of berries
                    this.collectedDiamonds -= portal.cost;    // Deduct diamonds
                    portal.unlocked = true;
                    break;
                }
            }
        }
    }

    drawWorkbench() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Position workbench 200px to the right of center
        const benchX = centerX + 200;
        const benchY = centerY;
        
        // Table top
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(benchX - 25, benchY - 15, 50, 10);
        
        // Table legs
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(benchX - 20, benchY - 5, 5, 20);
        this.ctx.fillRect(benchX + 15, benchY - 5, 5, 20);
        
        // Tools on the table
        this.ctx.fillStyle = '#4a4a4a';
        this.ctx.fillRect(benchX - 15, benchY - 20, 15, 5);
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(benchX - 5, benchY - 25, 5, 10);
        
        // Saw
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.fillRect(benchX + 5, benchY - 18, 15, 3);
        for(let i = 0; i < 5; i++) {
            this.ctx.fillRect(benchX + 7 + (i * 3), benchY - 20, 1, 2);
        }

        if (this.player) {
            const dx = this.player.x - benchX;
            const dy = this.player.y - benchY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 50) {
                this.drawInteractButton(benchX, benchY - 40);
            }
        }
    }

    drawInteractButton(x, y) {
        const time = Date.now() / 500; // For hover animation
        const hoverOffset = Math.sin(time) * 3; // Smooth hover effect
        const scale = 3; // Scale factor for larger button
        
        // Button background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x - 8*scale, y - 8*scale + hoverOffset, 16*scale, 16*scale);
        
        // Button border
        this.ctx.fillStyle = '#666666';
        this.ctx.fillRect(x - 8*scale, y - 8*scale + hoverOffset, 16*scale, 1*scale); // Top
        this.ctx.fillRect(x - 8*scale, y - 8*scale + hoverOffset, 1*scale, 16*scale); // Left
        this.ctx.fillRect(x + 7*scale, y - 8*scale + hoverOffset, 1*scale, 16*scale); // Right
        this.ctx.fillRect(x - 8*scale, y + 7*scale + hoverOffset, 16*scale, 1*scale); // Bottom
        
        // Letter F (pixel art)
        this.ctx.fillStyle = '#FFFFFF';
        // Horizontal lines
        this.ctx.fillRect(x - 4*scale, y - 4*scale + hoverOffset, 8*scale, 2*scale); // Top
        this.ctx.fillRect(x - 4*scale, y + hoverOffset, 6*scale, 2*scale); // Middle
        // Vertical line
        this.ctx.fillRect(x - 4*scale, y - 4*scale + hoverOffset, 2*scale, 10*scale); // Left
    }

    drawBearAttack(x, y) {
        if (!this.isAttackAnimating) return;

        this.ctx.save();
        this.ctx.translate(x, y);

        // Calculate attack progress (0 to 1)
        const progress = (Date.now() - this.attackStartTime) / this.attackDuration;
        if (progress >= 1) {
            this.isAttackAnimating = false;
            this.ctx.restore();
            return;
        }

        // Calculate arm angle based on progress
        const startAngle = -Math.PI/2; // Start pointing down
        const endAngle = -Math.PI/4;   // End at 45 degrees
        const currentAngle = startAngle + (endAngle - startAngle) * progress;

        // Get base arm length and adjust for double range power-up
        const baseArmLength = 80; // Increased from 40 to 80 to match hit box
        const armLength = this.hasDoubleRange ? baseArmLength * 2 : baseArmLength;
        
        // Calculate arm position
        const armX = Math.cos(currentAngle) * armLength;
        const armY = Math.sin(currentAngle) * armLength;

        // Draw arm shadow
        this.ctx.save();
        this.ctx.translate(armX, armY);
        this.ctx.rotate(currentAngle);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, -4, armLength, 8);
        this.ctx.restore();

        // Draw arm
        this.ctx.save();
        this.ctx.translate(armX, armY);
        this.ctx.rotate(currentAngle);
        
        // Create gradient for arm
        const gradient = this.ctx.createLinearGradient(0, 0, armLength, 0);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#8B4513');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, -4, armLength, 8);
        
        // Add arm details
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(0, -2, armLength, 4);
        
        // Add metallic shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(0, -4, armLength/4, 8);
        
        this.ctx.restore();

        // Draw claw at the end of the arm
        this.ctx.save();
        this.ctx.translate(armX, armY);
        this.ctx.rotate(currentAngle);
        this.ctx.translate(armLength, 0);
        
        // Draw claw shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw claw
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add claw details
        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add metallic shine to claw
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(-2, -2, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();

        // Draw attack effect
        if (progress > 0.3 && progress < 0.7) {
            this.ctx.save();
            this.ctx.translate(armX, armY);
            this.ctx.rotate(currentAngle);
            this.ctx.translate(armLength, 0);
            
            // Calculate effect size based on progress
            const effectProgress = (progress - 0.3) / 0.4; // 0.3 to 0.7
            const effectSize = 20 * (1 - Math.abs(effectProgress - 0.5) * 2);
            
            // Draw effect shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, effectSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw effect
            const effectGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, effectSize);
            effectGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            effectGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
            effectGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = effectGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, effectSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    drawCooldownBar() {
        if (!this.player || (!this.isAttackAnimating && Date.now() - this.lastAttackTime < this.player.attackCooldown)) {
            const now = Date.now();
            const cooldownProgress = Math.min(1, (now - this.lastAttackTime) / this.player.attackCooldown);
            
            // Position the bar above the player
            const barWidth = 40;
            const barHeight = 4;
            const barX = this.player.x - barWidth / 2;
            const barY = this.player.y - this.player.size - 15;

            // Draw background (empty bar)
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            // Draw border
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(barX, barY, barWidth, barHeight);

            // Draw progress (filled portion)
            this.ctx.fillStyle = `rgba(255, ${Math.floor(220 * cooldownProgress)}, 150, 0.8)`;
            this.ctx.fillRect(barX, barY, barWidth * cooldownProgress, barHeight);
        }
    }

    drawPond() {
        // Position pond up and to the right
        const pondX = this.canvas.width - 200;
        const pondY = 200;
        const pondWidth = 80; // Doubled size
        const pondHeight = 60; // Doubled size
        
        // Draw main pond shape
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.beginPath();
        this.ctx.ellipse(pondX, pondY, pondWidth, pondHeight, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Add water reflection effect (scaled up)
        this.ctx.fillStyle = '#5fa8f2';
        this.ctx.beginPath();
        this.ctx.ellipse(pondX - 20, pondY - 16, pondWidth/4, pondHeight/4, Math.PI/4, 0, Math.PI * 2);
        this.ctx.fill();

        // Add ripple effect (constrained within pond bounds)
        const time = Date.now() / 1000;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        
        // Save the context to apply clipping
        this.ctx.save();
        
        // Create clipping region to match pond shape
        this.ctx.beginPath();
        this.ctx.ellipse(pondX, pondY, pondWidth, pondHeight, 0, 0, Math.PI * 2);
        this.ctx.clip();
        
        // Draw ripples (now they'll be clipped to pond shape)
        for(let i = 0; i < 3; i++) {
            const rippleSize = 0.3 + (0.7 * ((time + i) % 2)); // Constrained ripple size
            this.ctx.beginPath();
            this.ctx.ellipse(pondX, pondY, pondWidth * rippleSize, pondHeight * rippleSize, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Restore the context
        this.ctx.restore();
    }

    checkPondCollision(nextX, nextY) {
        const pondX = this.canvas.width - 200;
        const pondY = 200;
        const pondWidth = 80;
        const pondHeight = 60;
        const playerRadius = this.player ? this.player.size / 2 : 0;

        // Calculate distance from next position to pond center using elliptical distance
        const dx = (nextX - pondX) / (pondWidth + playerRadius);
        const dy = (nextY - pondY) / (pondHeight + playerRadius);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Return true if the player would intersect with the water
        return distance < 1;
    }

    drawTree(x, y, size) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Draw trunk with gradient
        const trunkGradient = this.ctx.createLinearGradient(-size/4, -size/2, size/4, size/2);
        trunkGradient.addColorStop(0, '#4A2F10');
        trunkGradient.addColorStop(0.5, '#5D4037');
        trunkGradient.addColorStop(1, '#4A2F10');
        this.ctx.fillStyle = trunkGradient;
        this.ctx.fillRect(-size/4, -size/2, size/2, size);
        
        // Add trunk texture
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < 3; i++) {
            this.ctx.fillRect(-size/4 + (i * size/6), -size/2, 2, size);
        }
        
        // Draw multiple layers of leaves
        const leafLayers = 3;
        for (let i = 0; i < leafLayers; i++) {
            const layerSize = size * (1 - i * 0.2);
            const layerY = -size/2 - i * size/4;
            
            this.ctx.fillStyle = `rgba(46, 125, 50, ${0.7 + i * 0.1})`;
            this.ctx.beginPath();
            this.ctx.arc(0, layerY, layerSize/2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Add highlight to top of leaves
        const highlight = this.ctx.createRadialGradient(0, -size/2, size/4, 0, -size/2, size/2);
        highlight.addColorStop(0, 'rgba(102, 187, 106, 0.3)');
        highlight.addColorStop(1, 'rgba(102, 187, 106, 0)');
        this.ctx.fillStyle = highlight;
        this.ctx.beginPath();
        this.ctx.arc(0, -size/2, size/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawLeaves() {
        this.leaves.forEach(leaf => {
            // Update leaf position
            leaf.x += leaf.speedX;
            leaf.y += leaf.speedY;
            leaf.rotation += leaf.rotationSpeed;
            
            // Fade out as leaf approaches bottom
            const fadeStart = this.canvas.height - 100;
            if (leaf.y > fadeStart) {
                leaf.opacity = 0.8 - (leaf.y - fadeStart) / 100; // Start with 0.8 opacity
            }
            
            this.ctx.save();
            this.ctx.translate(leaf.x, leaf.y);
            this.ctx.rotate(leaf.rotation);
            
            // Draw leaf with gradient
            const leafGradient = this.ctx.createLinearGradient(-leaf.size/2, -leaf.size/2, leaf.size/2, leaf.size/2);
            leafGradient.addColorStop(0, leaf.color);
            leafGradient.addColorStop(1, this.adjustColor(leaf.color, -20));
            
            this.ctx.fillStyle = leaf.color;
            this.ctx.globalAlpha = leaf.opacity;
            
            // Draw leaf shape
            this.ctx.beginPath();
            this.ctx.moveTo(0, -leaf.size/2);
            this.ctx.bezierCurveTo(
                leaf.size/2, -leaf.size/4,
                leaf.size/2, leaf.size/4,
                0, leaf.size/2
            );
            this.ctx.bezierCurveTo(
                -leaf.size/2, leaf.size/4,
                -leaf.size/2, -leaf.size/4,
                0, -leaf.size/2
            );
            this.ctx.fill();
            
            // Add leaf vein with reduced opacity
            this.ctx.strokeStyle = this.adjustColor(leaf.color, -30);
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = leaf.opacity * 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -leaf.size/2);
            this.ctx.lineTo(0, leaf.size/2);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }

    // Helper function to adjust color brightness
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    drawMysteryBox() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Position box 200px down and 50px right from center
        const boxX = centerX + 50;
        const boxY = centerY + 200;

        // Box dimensions
        const boxWidth = 120;
        const boxHeight = 40;

        // Draw main box body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(boxX - boxWidth/2, boxY - boxHeight/2, boxWidth, boxHeight);
        
        // Add wood grain texture
        this.ctx.fillStyle = 'rgba(90, 50, 10, 0.3)';
        for (let i = 0; i < 6; i++) {
            this.ctx.fillRect(boxX - boxWidth/2 + i * 20, boxY - boxHeight/2, 2, boxHeight);
        }
        
        // Add metal reinforcements on edges
        this.ctx.fillStyle = '#4a4a4a';
        // Left and right edges
        this.ctx.fillRect(boxX - boxWidth/2, boxY - boxHeight/2, 5, boxHeight);
        this.ctx.fillRect(boxX + boxWidth/2 - 5, boxY - boxHeight/2, 5, boxHeight);
        // Top and bottom edges
        this.ctx.fillRect(boxX - boxWidth/2, boxY - boxHeight/2, boxWidth, 5);
        this.ctx.fillRect(boxX - boxWidth/2, boxY + boxHeight/2 - 5, boxWidth, 5);

        // Draw price tag inside the box
        const hasEnoughBerries = this.berryCount >= 10;
        this.ctx.fillStyle = hasEnoughBerries ? '#FFD700' : '#FF6B6B';
        this.ctx.font = '14px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('10', boxX - 10, boxY + 5);
        
        // Draw berry icon next to the number
        this.drawBerry(boxX + 15, boxY + 2, 14);

        // Draw floating question mark
        this.drawFloatingQuestionMark(boxX, boxY - boxHeight/2);

        // Draw the F key interaction prompt if player is near
        if (this.isNearBox()) {
            this.drawInteractButton(boxX, boxY - 110);
        }

        // Draw box animation if active
        if (this.boxAnimationActive) {
            this.drawBoxAnimation(boxX, boxY);
        }
    }

    isNearBox() {
        if (!this.player) return false;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const boxX = centerX + 50;
        const boxY = centerY + 200;
        
        const dx = this.player.x - boxX;
        const dy = this.player.y - boxY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 120; // Increased from 60 to 120 pixels for wider range
    }

    // Update the box interaction to require 10 berries
    handleBoxInteraction() {
        if (this.isNearBox() && this.berryCount >= 10 && !this.boxAnimationActive) {
            this.berryCount -= 10; // Deduct berries
            this.boxAnimationActive = true;
            this.boxAnimationProgress = 0;
            this.boxAnimationStartTime = Date.now();
            this.collectedDiamonds++; // Add a diamond
        }
    }

    drawFloatingQuestionMark(x, y) {
        // Update animation time
        if (!this.showUpgradeMenu && !this.showShopMenu && !this.showHealMenu) {
            this.questionMarkTime += 0.05;
        }
        
        // Calculate hover and bounce effect
        const hoverHeight = 25; // Reduced from 30 to move down 5 pixels
        const bounceHeight = Math.sin(this.questionMarkTime * 2) * 5;
        const finalY = y - hoverHeight + bounceHeight;
        
        this.ctx.save();
        
        // Add glow effect
        const glowRadius = 20;
        const gradient = this.ctx.createRadialGradient(
            x, finalY, 0,
            x, finalY, glowRadius
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, finalY, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw question mark
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Main curve of question mark (flipped and more curved)
        this.ctx.beginPath();
        this.ctx.moveTo(x - 8, finalY - 15);
        this.ctx.quadraticCurveTo(
            x - 8, finalY - 25,
            x + 8, finalY - 25
        );
        this.ctx.quadraticCurveTo(
            x + 20, finalY - 25,
            x + 20, finalY - 15
        );
        this.ctx.quadraticCurveTo(
            x + 20, finalY - 5,
            x + 8, finalY - 5
        );
        this.ctx.quadraticCurveTo(
            x, finalY - 5,
            x, finalY + 5
        );
        this.ctx.stroke();

        // Bottom dot
        this.ctx.beginPath();
        this.ctx.arc(x, finalY + 12, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();

        this.ctx.restore();
    }

    drawBoxAnimation(boxX, boxY) {
        const now = Date.now();
        const elapsed = now - this.boxAnimationStartTime;
        this.boxAnimationProgress = Math.min(elapsed / 1000, 1); // 1 second animation

        // Calculate position using easing function
        const startY = boxY;
        const endY = boxY - 100; // Move up 100 pixels
        const currentY = startY + (endY - startY) * (1 - Math.pow(1 - this.boxAnimationProgress, 2));

        // Calculate size and opacity
        const size = 20 + (this.boxAnimationProgress * 10); // Grow from 20 to 30
        const opacity = 1 - this.boxAnimationProgress;

        // Draw the diamond
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.drawDiamond(boxX, currentY, size);
        this.ctx.restore();

        // When animation completes, just end the animation
        if (this.boxAnimationProgress >= 1) {
            this.boxAnimationActive = false;
        }
    }

    drawDiamond(x, y, size) {
        this.ctx.save();
        
        // Create gradient for 3D effect
        const gradient = this.ctx.createLinearGradient(x - size, y - size, x + size, y + size);
        gradient.addColorStop(0, '#4169E1');    // Royal Blue
        gradient.addColorStop(0.5, '#6495ED');  // Cornflower Blue
        gradient.addColorStop(1, '#4169E1');    // Royal Blue

        this.ctx.fillStyle = gradient;
        
        // Draw main diamond shape
        this.ctx.beginPath();
        // Top point
        this.ctx.moveTo(x, y - size);
        // Right point
        this.ctx.lineTo(x + size, y);
        // Bottom point
        this.ctx.lineTo(x, y + size);
        // Left point
        this.ctx.lineTo(x - size, y);
        this.ctx.closePath();
        this.ctx.fill();

        // Add shine effect
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size/2);
        this.ctx.lineTo(x + size/3, y);
        this.ctx.lineTo(x, y + size/2);
        this.ctx.lineTo(x - size/3, y);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fill();

        // Add outline
        this.ctx.strokeStyle = '#1E90FF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawGroundDiamonds() {
        const now = Date.now();
        this.groundDiamonds = this.groundDiamonds.filter(diamond => {
            const timeElapsed = now - diamond.spawnTime;
            if (timeElapsed >= diamond.duration) {
                return false;
            }

            // Calculate visibility for blinking effect in last 5 seconds
            const remainingTime = diamond.duration - timeElapsed;
            if (remainingTime <= 5000) {
                // Increase blink frequency as time runs out
                const blinkFrequency = (5000 - remainingTime) / 500; // Increases from 0 to 10
                const visibility = Math.sin(blinkFrequency * timeElapsed / 100) > 0;
                if (!visibility) {
                    return true; // Skip drawing but keep the diamond
                }
            }

            this.drawDiamond(diamond.x, diamond.y, diamond.size);
            return true;
        });
    }

    drawEnvironment() {
        // Draw trees
        this.trees.forEach(tree => {
            this.drawTree(tree.x, tree.y, tree.size);
        });

        // Draw falling leaves
        this.drawLeaves();
        this.spawnLeaves();

        // Draw pond before workbench
        this.drawPond();

        // Draw fire and workbench
        this.drawFire();
        this.drawWorkbench();
        
        // Draw ground diamonds before mystery box
        this.drawGroundDiamonds();
        
        // Draw mystery box
        this.drawMysteryBox();
        
        // Draw box animation if active
        if (this.boxAnimationActive) {
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const boxX = centerX + 50;
            const boxY = centerY + 200;
            this.drawBoxAnimation(boxX, boxY);
        }
        
        // Draw berry swapper
        this.drawBerrySwapper();
        
        // Draw med station if purchased
        if (this.hasMedStation) {
            this.drawMedStation();
        }
        
        // Draw shop
        this.drawShop();

        // Draw magnets
        this.drawMagnets();

        // Draw double range power-ups
        this.drawDoubleRanges();

        // Draw berries
        this.berries.forEach(berry => {
            if (!berry.collected) {
                this.drawBerry(berry.x, berry.y, berry.size);
            }
        });

        // Draw hunters
        this.hunters.forEach(hunter => {
            hunter.draw(this.ctx);
        });
    }

    drawShop() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Position shop 200px to the left and 150px up from center
        const shopX = centerX - 200;
        const shopY = centerY - 150;

        // Draw counter
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(shopX - 40, shopY - 10, 80, 60);
        
        // Draw wood grain
        this.ctx.fillStyle = 'rgba(90, 50, 10, 0.3)';
        for (let i = 0; i < 4; i++) {
            this.ctx.fillRect(shopX - 40 + (i * 20), shopY - 10, 2, 60);
        }

        // Draw roof supports
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(shopX - 35, shopY - 50, 8, 40);
        this.ctx.fillRect(shopX + 27, shopY - 50, 8, 40);
        
        // Draw striped roof
        const roofWidth = 100;
        const roofHeight = 25;
        const stripeWidth = 10;
        
        for (let i = 0; i < roofWidth/stripeWidth; i++) {
            this.ctx.fillStyle = i % 2 === 0 ? '#FF6B6B' : '#FFFFFF';
            this.ctx.fillRect(
                shopX - roofWidth/2 + (i * stripeWidth),
                shopY - 50,
                stripeWidth,
                roofHeight
            );
        }

        // Draw items on display
        this.ctx.fillStyle = '#9C27B0';
        this.ctx.fillRect(shopX - 25, shopY - 5, 15, 20);
        this.ctx.fillStyle = '#7B1FA2';
        this.ctx.fillRect(shopX - 22, shopY - 8, 9, 5);

        this.ctx.fillStyle = '#8D6E63';
        this.ctx.fillRect(shopX + 5, shopY, 25, 15);
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(shopX + 17, shopY - 2, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Only show UI elements if player is in range
        if (this.isNearShop()) {
            // Draw lock and price tag if player doesn't have enough diamonds
            if (!this.shopUnlocked) {
                // Draw semi-transparent grey overlay
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(shopX - 45, shopY - 55, 90, 105);
                
                this.drawLock(shopX, shopY - 20);
                this.drawShopPriceTag(shopX, shopY);
            }
            
            // Draw interaction prompt
            this.drawInteractButton(shopX, shopY - 110);
        }
    }

    drawShopPriceTag(x, y) {
        const tagWidth = 60;
        const tagHeight = 40;
        const tagX = x - tagWidth/2;
        const tagY = y + 10;

        // Calculate total width of text and diamond for centering
        const textWidth = 30; // Width for "1x" text
        const diamondWidth = 12; // Width for diamond (25% smaller than before)
        const spacing = 5; // Spacing between text and diamond
        const totalWidth = textWidth + diamondWidth + spacing;
        
        // Calculate starting position to center all elements
        let currentX = tagX + (tagWidth - totalWidth) / 2;

        // Draw "1x" text
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '14px "Press Start 2P"';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('1x', currentX, tagY + 25);
        currentX += textWidth + spacing;
        
        // Draw diamond icon (25% smaller)
        this.drawDiamond(currentX, tagY + 20, 12);
    }

    isNearShop() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const shopX = centerX - 200;
        const shopY = centerY - 150;
        
        const dx = this.player.x - shopX;
        const dy = this.player.y - shopY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 100;
    }

    drawBerrySwapperPriceTag(x, y) {
        const tagWidth = 120;
        const tagHeight = 50;
        const tagX = x - tagWidth/2;
        const tagY = y + this.berrySwapperSize/3 + 5;

        // Calculate total width of all elements
        const textWidth = 40; // Width for "10x" and "1x" text
        const berryWidth = 12; // Width for red berry
        const blueberryWidth = 16; // Width for blueberry
        const equalsWidth = 12; // Width for equals sign
        const spacing = 8; // Spacing between elements

        // Calculate starting position to center all elements
        const totalWidth = textWidth + berryWidth + equalsWidth + textWidth + blueberryWidth + (spacing * 4);
        let currentX = tagX + (tagWidth - totalWidth) / 2;

        // Draw "10x" text
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('10x', currentX, tagY + 20);
        currentX += textWidth + spacing;

        // Draw red berry
        this.drawBerry(currentX, tagY + 15, 12);
        currentX += berryWidth + spacing;

        // Draw equals sign
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillText('=', currentX, tagY + 20);
        currentX += equalsWidth + spacing;

        // Draw "1x" text
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.fillText('1x', currentX, tagY + 20);
        currentX += textWidth + spacing;

        // Draw blueberry
        if (this.blueberryImage.complete) {
            this.ctx.drawImage(this.blueberryImage, currentX - 20, tagY + 7, 20, 20);
        }
    }

    drawShopMenu() {
        if (!this.showShopMenu || !this.shopUnlocked) return;

        const menuWidth = 600;
        const menuHeight = 400;
        const menuX = (this.canvas.width - menuWidth) / 2;
        const menuY = (this.canvas.height - menuHeight) / 2;

        // Draw wooden panel background
        this.ctx.fillStyle = '#8B4513';
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.roundRect(menuX, menuY, menuWidth, menuHeight, 10);
        this.ctx.fill();
        this.ctx.stroke();

        // Add wood grain texture
        this.ctx.fillStyle = 'rgba(90, 50, 10, 0.3)';
        for (let i = 0; i < 12; i++) {
            this.ctx.fillRect(menuX + i * 50, menuY, 2, menuHeight);
        }

        // Title
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '24px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Shop', this.canvas.width/2, menuY + 50);

        // Draw centered blueberry count with icon
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        const berryText = `${this.blueberryCount}x`;
        const berryTextWidth = this.ctx.measureText(berryText).width;
        const totalWidth = berryTextWidth + 30; // 30px for the berry icon and spacing
        const startX = menuX + (menuWidth - totalWidth) / 2;
        
        this.ctx.fillText(berryText, startX + berryTextWidth/2, menuY + 80);
        this.ctx.drawImage(
            this.blueberryImage,
            startX + berryTextWidth + 10,
            menuY + 80 - 7,
            14,
            14
        );

        // Always show Restore Heart option, but grey it out if health is full
        const itemY = menuY + 120;
        const hasMaxHealth = this.playerHealth >= this.maxHealth;
        const hasEnoughBerries = this.blueberryCount >= 1;
        
        // Selection highlight
        if (this.selectedShopItem === 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(menuX + 20, itemY - 25, menuWidth - 40, 60);
        }

        // Item name and description
        this.ctx.fillStyle = hasMaxHealth ? '#808080' : (this.selectedShopItem === 0 ? '#FFE0B2' : '#DEB887');
        this.ctx.textAlign = 'left';
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillText('Restore Heart', menuX + 40, itemY);
        
        // Description
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillText('Restore one heart', menuX + 40, itemY + 20);

        // Price with blueberry icon
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = hasMaxHealth ? '#808080' : (hasEnoughBerries ? '#FFE0B2' : '#8B0000');
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillText('1x', menuX + menuWidth - 60, itemY);
        this.ctx.drawImage(
            this.blueberryImage,
            menuX + menuWidth - 40,
            itemY - 7,
            14,
            14
        );

        // Instructions
        this.ctx.fillStyle = '#DEB887';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Use W/S to select, SPACE to purchase', this.canvas.width/2, menuY + menuHeight - 30);
        this.ctx.fillText('Press F to close', this.canvas.width/2, menuY + menuHeight - 15);
    }

    purchaseShopItem() {
        // Only allow purchase if player is missing health and has enough blueberry
        if (this.playerHealth < this.maxHealth && this.blueberryCount >= 1) {
            this.blueberryCount--;
            // Restore one heart while maintaining current max health
            this.playerHealth = Math.min(this.playerHealth + 1, this.maxHealth);
            this.hearts = this.playerHealth; // Update hearts to match current health
            this.sounds.purchase.play();
            this.startScreenShake(20, 500);
        }
    }

    drawMedStation() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Position med station 200px to the right and 150px up from center
        const stationX = centerX + 200;
        const stationY = centerY - 150;
        
        // Draw main building
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(stationX - 40, stationY - 30, 80, 60);
        
        // Draw roof
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.beginPath();
        this.ctx.moveTo(stationX - 45, stationY - 30);
        this.ctx.lineTo(stationX + 45, stationY - 30);
        this.ctx.lineTo(stationX, stationY - 60);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw cross symbol
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(stationX - 5, stationY - 20, 10, 30);
        this.ctx.fillRect(stationX - 15, stationY - 5, 30, 10);
        
        // Draw windows
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(stationX - 30, stationY - 20, 15, 15);
        this.ctx.fillRect(stationX + 15, stationY - 20, 15, 15);
        
        // Draw door
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(stationX - 10, stationY + 5, 20, 25);

        if (this.player && this.isNearHospital()) {
            this.drawInteractButton(stationX, stationY - 70);
        }
    }

    isNearHospital() {
        if (!this.player || !this.hasMedStation) return false;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Match the exact coordinates from drawMedStation method
        const stationX = centerX + 200;
        const stationY = centerY - 150;
        
        const dx = this.player.x - stationX;
        const dy = this.player.y - stationY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Debug log to help troubleshoot
        console.log(`Distance to hospital: ${distance}, isNear: ${distance < 60}`);
        
        return distance < 60;
    }

    drawHealMenu() {
        // Semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Menu container
        const menuWidth = 600;
        const menuHeight = 300;
        const menuX = (this.canvas.width - menuWidth) / 2;
        const menuY = (this.canvas.height - menuHeight) / 2;

        // Draw wooden panel background
        this.ctx.fillStyle = '#8B4513';
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.roundRect(menuX, menuY, menuWidth, menuHeight, 10);
        this.ctx.fill();
        this.ctx.stroke();

        // Add wood grain texture
        this.ctx.fillStyle = 'rgba(90, 50, 10, 0.3)';
        for (let i = 0; i < 12; i++) {
            this.ctx.fillRect(menuX + i * 50, menuY, 2, menuHeight);
        }

        // Title
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '24px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Hospital', this.canvas.width/2, menuY + 50);

        // Healing message
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillText('Purchase 1 Life for 5 Blueberries', this.canvas.width/2, menuY + 120);

        // Draw cost with blueberry icon
        this.ctx.fillStyle = this.blueberryCount >= 5 ? '#FFE0B2' : '#8B0000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('5', this.canvas.width/2 - 20, menuY + 160);
        if (this.blueberryImage.complete) {
            this.ctx.drawImage(
                this.blueberryImage,
                this.canvas.width/2 + 10,
                menuY + 158 - 8,
                16,
                16
            );
        }

        // Instructions
        this.ctx.fillStyle = '#DEB887';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press SPACE to purchase, F to close', this.canvas.width/2, menuY + menuHeight - 15);
    }

    purchaseHeal() {
        if (this.blueberryCount >= 5 && this.hearts < this.stats.health.value) {
            this.blueberryCount -= 5;
            this.hearts = Math.min(this.hearts + 1, this.stats.health.value);
        }
    }

    drawUpgradeMenu() {
        if (!this.showUpgradeMenu) return;

        const menuWidth = 600;
        const menuHeight = 400;
        const menuX = (this.canvas.width - menuWidth) / 2;
        const menuY = (this.canvas.height - menuHeight) / 2;

        // Draw wooden panel background
        this.ctx.fillStyle = '#8B4513';
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.roundRect(menuX, menuY, menuWidth, menuHeight, 10);
        this.ctx.fill();
        this.ctx.stroke();

        // Add wood grain texture
        this.ctx.fillStyle = 'rgba(90, 50, 10, 0.3)';
        for (let i = 0; i < 12; i++) {
            this.ctx.fillRect(menuX + i * 50, menuY, 2, menuHeight);
        }

        // Title
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '24px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Upgrades', this.canvas.width/2, menuY + 50);

        // Draw centered berry count with icon
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        const berryText = `${this.berryCount}x`;
        const berryTextWidth = this.ctx.measureText(berryText).width;
        const totalWidth = berryTextWidth + 30; // 30px for the berry icon and spacing
        const startX = menuX + (menuWidth - totalWidth) / 2;
        
        this.ctx.fillText(berryText, startX + berryTextWidth/2, menuY + 80);
        this.drawBerry(startX + berryTextWidth + 10, menuY + 80 - 8, 16);

        // Draw upgrades
        this.upgrades.forEach((upgrade, index) => {
            const y = menuY + 120 + index * 70;
            const isSelected = this.selectedUpgrade === index;

            // Selection highlight
            if (isSelected) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fillRect(menuX + 20, y - 25, menuWidth - 40, 60);
            }

            // Upgrade name and level
            this.ctx.fillStyle = isSelected ? '#FFE0B2' : '#DEB887';
            this.ctx.textAlign = 'left';
            this.ctx.font = '16px "Press Start 2P"';
            this.ctx.fillText(`${upgrade.name} (${upgrade.level}/${upgrade.maxLevel})`, menuX + 40, y);

            // Price with berry icon
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = this.berryCount >= upgrade.cost ? '#FFE0B2' : '#8B0000';
            this.ctx.fillText(`${upgrade.cost}x`, menuX + menuWidth - 60, y);
            this.drawBerry(menuX + menuWidth - 40, y - 8, 16);
        });

        // Instructions
        this.ctx.fillStyle = '#DEB887';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Use W/S to select, SPACE to purchase', this.canvas.width/2, menuY + menuHeight - 30);
        this.ctx.fillText('Press F to close', this.canvas.width/2, menuY + menuHeight - 15);
    }

    handleUpgradeClick(x, y) {
        const menuWidth = 600;
        const menuHeight = 400;
        const menuX = (this.canvas.width - menuWidth) / 2;
        const menuY = (this.canvas.height - menuHeight) / 2;

        // Check if click is within upgrade options area
        if (x >= menuX && x <= menuX + menuWidth) {
            this.upgrades.forEach((upgrade, index) => {
                const upgradeY = menuY + 120 + index * 70;
                if (y >= upgradeY - 25 && y <= upgradeY + 35) {
                    this.selectedUpgrade = index;
                }
            });
        }
    }

    purchaseSelectedUpgrade() {
        const selectedUpgrade = this.upgrades[this.selectedUpgrade];
        if (selectedUpgrade && this.berryCount >= selectedUpgrade.cost && selectedUpgrade.level < selectedUpgrade.maxLevel) {
            this.berryCount -= selectedUpgrade.cost;
            selectedUpgrade.level++;
            selectedUpgrade.cost = Math.floor(selectedUpgrade.cost * 1.5);
            
            // Update the stat value based on the upgrade
            switch(selectedUpgrade.name) {
                case 'Attack Speed':
                    this.stats.attackSpeed.value = this.stats.attackSpeed.baseValue * (1 + (selectedUpgrade.level - 1) * 0.2);
                    break;
                case 'Movement Speed':
                    this.stats.moveSpeed.value = this.stats.moveSpeed.baseValue * (1 + (selectedUpgrade.level - 1) * 0.2);
                    break;
                case 'Health':
                    // Calculate current health ratio before increasing max health
                    const healthRatio = this.playerHealth / this.maxHealth;
                    this.maxHealth++;  // Increase max health
                    this.playerHealth = Math.floor(this.maxHealth * healthRatio);  // Maintain health ratio
                    this.hearts = this.playerHealth;  // Update hearts to match current health
                    break;
                case 'Attack Damage':
                    this.stats.attackDamage.value = this.stats.attackDamage.baseValue * (1 + (selectedUpgrade.level - 1) * 0.2);
                    break;
            }
        }
    }

    spawnBerries() {
        const now = Date.now();
        const spawnInterval = 2000; // Spawn berries every 2 seconds
        const maxBerries = 20; // Maximum number of berries on screen

        if (now - this.lastBerrySpawn > spawnInterval && this.berries.length < maxBerries) {
            this.lastBerrySpawn = now;
            
            // Try to spawn a berry near a random tree
            if (this.trees.length > 0) {
                const tree = this.trees[Math.floor(Math.random() * this.trees.length)];
                const angle = Math.random() * Math.PI * 2;
                const distance = tree.size + Math.random() * 30;
                
                this.berries.push({
                    x: tree.x + Math.cos(angle) * distance,
                    y: tree.y + Math.sin(angle) * distance,
                    size: 20, // Doubled from 10
                    collected: false
                });
            }
        }

        // Remove collected berries
        this.berries = this.berries.filter(berry => !berry.collected);
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Clear canvas
        this.ctx.fillStyle = '#2E7D32';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.isGameOver) {
            this.drawGameOver();
            return;
        }

        // Draw game world
        this.ctx.save();
        
        // Apply reveal animation
        if (this.animationProgress < 1) {
            const scale = 1 + (1 - this.animationProgress) * 2;
            this.ctx.globalAlpha = this.animationProgress;
            this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
            this.ctx.scale(scale, scale);
            this.ctx.translate(-this.canvas.width/2, -this.canvas.height/2);
        }

        // Apply screen shake
        const shake = this.updateScreenShake();
        this.ctx.translate(shake.x, shake.y);

        // Draw environment
        this.drawEnvironment();

        // Update and draw player
        if (this.animationProgress === 1) {
            // Always update game state
            this.updateGameState(deltaTime);
            this.updateWave(); // Add wave update here

            if (this.player) {
                this.player.draw(this.ctx);
                this.drawCooldownBar();
            }
        }

        this.ctx.restore();

        // Draw UI elements
        this.drawUI();

        // Draw menus
        if (this.showUpgradeMenu) {
            this.drawUpgradeMenu();
        } else if (this.showShopMenu) {
            this.drawShopMenu();
        } else if (this.showHealMenu) {
            this.drawHealMenu();
        }

        // Draw wave announcement
        this.drawWaveAnnouncement();

        // Update animation progress
        if (this.animationProgress < 1) {
            this.animationProgress = Math.min(1, (currentTime - this.startTime) / 1000);
        }

        // Request next frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    updateGameState(deltaTime) {
        // Always update these regardless of menu state
        this.player.move(this.keys, deltaTime);
        this.checkBerryCollection();
        this.checkDiamondCollection();
        this.updateMagnets();
        this.updateDoubleRanges();
        this.updateBerrySwapper();
        this.spawnBerries();
        this.spawnLeaves();
        
        // Update animations
        this.fireAnimationTime += 0.1;
        this.fireAnimationFrame = (this.fireAnimationFrame + 1) % 30;
        if (!this.portalAnimationTime) this.portalAnimationTime = 0;
        this.portalAnimationTime += 0.02;

        // Add hunter updates - only pause if a menu is actually open
        if (!this.showShopMenu && !this.showUpgradeMenu && !this.showHealMenu) {
            this.updateHunters(deltaTime);
            
            // Start first wave if not already started
            if (this.currentWave === 0 && !this.waveInProgress) {
                this.startWave();
            }
        }
    }

    setupControls() {
        // ... existing code ...

        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            // Handle WASD movement
            if (['w', 's', 'a', 'd'].includes(key)) {
                if (!this.showUpgradeMenu && !this.showShopMenu && !this.showHealMenu) {
                    this.keys[key] = true;
                }
            }

            // Handle menu navigation
            if (this.showUpgradeMenu) {
                if (key === 'w') {
                    this.selectedUpgrade = Math.max(0, this.selectedUpgrade - 1);
                } else if (key === 's') {
                    this.selectedUpgrade = Math.min(this.upgrades.length - 1, this.selectedUpgrade + 1);
                }
            }

            if (this.showShopMenu) {
                if (key === 'w') {
                    this.selectedShopItem = Math.max(0, this.selectedShopItem - 1);
                } else if (key === 's') {
                    this.selectedShopItem = Math.min(0, this.selectedShopItem + 1);
                }
            }

            // Handle F key interactions
            if (key === 'f') {
                // Handle menu closing first
                if (this.showShopMenu) {
                    this.showShopMenu = false;
                    return;
                }
                if (this.showUpgradeMenu) {
                    this.showUpgradeMenu = false;
                    return;
                }
                if (this.showHealMenu) {
                    this.showHealMenu = false;
                    return;
                }

                // Then handle interactions
                if (this.isNearBox()) {
                    this.handleBoxInteraction();
                } else if (this.isNearShop()) {
                    if (!this.shopUnlocked) {
                        // First state: Try to unlock shop with 1 diamond
                        if (this.collectedDiamonds >= 1) {
                            this.collectedDiamonds -= 1;
                            this.shopUnlocked = true;
                        }
                        // Do nothing else if shop is not unlocked
                        return;
                    } else {
                        // Second state: Open shop menu only if unlocked
                        this.showShopMenu = true;
                    }
                } else if (this.isNearBerrySwapper()) {
                    this.handleBerrySwapperInteraction();
                } else if (this.isNearHospital()) {
                    this.showHealMenu = true;
                } else if (this.isNearWorkbench()) {
                    this.showUpgradeMenu = true;
                }
            }

            if (e.key.toLowerCase() === ' ') {
                if (this.showUpgradeMenu) {
                    this.purchaseSelectedUpgrade();
                }
                if (this.showShopMenu) {
                    this.purchaseShopItem();
                }
                if (this.showHealMenu) {
                    this.purchaseHeal();
                }
                if (this.isGameOver) {
                    this.resetGame();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 's', 'a', 'd'].includes(key)) {
                this.keys[key] = false;
            }
        });

        // ... rest of existing code ...
    }

    start(playerName) {
        this.playerName = playerName;
        this.gameStarted = true;
        this.gameOver = false;
        this.waveNumber = 1;
        this.isRunning = true;
        this.startTime = Date.now();
        this.lastFrameTime = Date.now();
        this.animationProgress = 0;
        this.lastAttackTime = 0;
        this.isGameOver = false;
        this.isAttackAnimating = false;
        this.hitHunters = new Set();
        this.hasDoubleRange = false;
        this.hasMagnet = false;
        this.magnetTimeLeft = 0;
        this.doubleRangeTimeLeft = 0;
        this.magnetDuration = 15000;  // 15 seconds
        this.doubleRangeDuration = 15000;  // 15 seconds
        this.magnetDropChance = 0.1;
        this.doubleRangeDropChance = 0.1;
        this.doubleRangeAnimationTime = 0;
        this.huntersKilled = 0;
        this.blueberryCount = 0;
        this.diamondCount = 0;
        this.berryCount = 0;
        this.hunterKills = 0;
        this.extraLives = 0;
        this.extraLivesCost = 1;
        this.shopUnlocked = false;
        this.hasMedStation = false;
        this.medStationCost = 10;
        this.hasBerrySwapper = false;
        this.berrySwapperCost = 5;
        this.berrySwapperCooldown = 0;
        this.berrySwapperCooldownTime = 5000;
        this.blueberryAnimationActive = false;
        this.blueberryAnimationProgress = 0;
        this.blueberryAnimationStartTime = 0;
        this.blueberryAnimationDuration = 1000;
        this.groundItems = [];
        this.selectedShopItem = 0;
        this.selectedUpgrade = 0;
        this.upgradeLevels = {
            attackSpeed: 0,
            movementSpeed: 0,
            health: 0,
            attackDamage: 0
        };
        this.upgradeCosts = {
            attackSpeed: 5,
            movementSpeed: 5,
            health: 5,
            attackDamage: 5
        };
        this.maxUpgradeLevel = 5;

        // Reset player stats
        this.stats = {
            attackSpeed: { level: 1, value: 1.0, cost: 5, baseValue: 1.0 },
            moveSpeed: { level: 1, value: 1.0, cost: 5, baseValue: 1.0 },
            health: { level: 1, value: 3, cost: 10, baseValue: 3 },
            attackDamage: { level: 1, value: 10, cost: 8, baseValue: 10 }
        };

        // Reset player attributes
        this.playerHealth = 3;
        this.maxHealth = 3;
        this.hearts = 3;
        this.playerSpeed = 5;

        // Initialize player with base stats
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 + 20;
        this.player = new Player(centerX, centerY, CONFIG.player.size, CONFIG.player.speed);
        this.player.attackDuration = 300;
        this.player.attackCooldown = 1000;

        // Initialize keys object for player movement
        this.keys = { w: false, s: false, a: false, d: false };

        // Initialize game objects
        this.hunters = [];
        this.berries = [];
        this.magnets = [];
        this.doubleRanges = [];
        this.portals = [];
        this.trees = [];
        this.leaves = [];
        this.lastLeafSpawn = 0;
        this.leafSpawnInterval = 2000;

        // Initialize wave system
        this.currentWave = 1;
        this.waveInProgress = true;
        this.huntersToSpawn = 5;
        this.hunterSpawnInterval = 5000;
        this.waveStartTime = Date.now();
        this.lastHunterSpawn = Date.now();
        this.showWaveAnnouncement = true;
        this.waveAnnouncementTime = Date.now();
        this.waveAnnouncementDuration = 5000;
        this.nextWaveNumber = 1; // Start with Wave 1 announcement

        // Show wave counter
        const waveCounter = document.getElementById('wave-counter');
        if (waveCounter) {
            waveCounter.textContent = `Wave: ${this.currentWave}`;
            waveCounter.classList.remove('hidden');
        }

        // Initialize screen shake
        this.screenShake = {
            active: false,
            intensity: 0,
            startTime: 0,
            duration: 0
        };

        // Generate initial environment
        this.generateTrees();
        this.spawnBerries();
        
        // Start the game loop
        this.gameLoop();
    }

    startAttack() {
        if (!this.player || this.isAttackAnimating) return;

        const now = Date.now();
        if (now - this.lastAttackTime >= this.player.attackCooldown) {
            console.log('Starting attack animation...');
            this.lastAttackTime = now;
            this.isAttackAnimating = true;
            
            // Start the player's attack animation
            this.player.startAttack(this.mouseX, this.mouseY);
            
            // Reset hit tracking
            this.hitHunters = new Set();
            
            // End attack after duration
            setTimeout(() => {
                console.log('Ending attack animation...');
                this.isAttackAnimating = false;
                this.verifyHunterHealth();
            }, this.player.attackDuration);
        }
    }
    
    // Add a new method to verify hunter health
    verifyHunterHealth() {
        console.log("VERIFYING ALL HUNTER HEALTH:");
        this.hunters.forEach((hunter, index) => {
            console.log(`Hunter ${index}: ${hunter.currentHealth}/${hunter.maxHealth} health`);
        });
    }

    isNearWorkbench() {
        if (!this.player) return false;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const benchX = centerX + 200;
        const benchY = centerY;
        
        const dx = this.player.x - benchX;
        const dy = this.player.y - benchY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 50; // Return true if player is within 50 pixels of workbench
    }

    startWave() {
        this.currentWave++;
        
        // More balanced wave scaling
        const baseHunters = 5;
        const huntersPerWave = 2;
        const maxHunters = 20;
        this.huntersToSpawn = Math.min(baseHunters + (this.currentWave - 1) * huntersPerWave, maxHunters);
        
        // Slower spawn rate scaling
        const baseInterval = 5000; // 5 seconds
        const intervalReduction = 200; // Reduce by 200ms per wave
        const minInterval = 2000; // Minimum 2 seconds between spawns
        this.hunterSpawnInterval = Math.max(baseInterval - (this.currentWave - 1) * intervalReduction, minInterval);
        
        this.waveInProgress = true;
        this.lastHunterSpawn = Date.now();
        
        // Show wave announcement
        this.showWaveAnnouncement = true;
        this.waveAnnouncementTime = Date.now();
        this.waveAnnouncementDuration = 5000;
    }

    spawnHunter() {
        const spawnSide = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;
        
        switch(spawnSide) {
            case 0: // top
                x = Math.random() * this.canvas.width;
                y = -50;
                break;
            case 1: // right
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                break;
            case 3: // left
                x = -50;
                y = Math.random() * this.canvas.height;
                break;
        }

        // New speed scaling pattern:
        // - Start very slow (0.1)
        // - Minimal increase until wave 10
        // - After wave 10, speed increases more significantly
        let speed;
        
        if (this.currentWave < 10) {
            // Waves 1-9: Start at 0.1 and increase by only 0.01 per wave
            speed = 0.1 + (this.currentWave - 1) * 0.01;
        } else {
            // Wave 10+: Base speed of 0.2 with faster scaling of 0.02 per wave
            const wavesAfter10 = this.currentWave - 10;
            speed = 0.2 + wavesAfter10 * 0.02;
        }
        
        // Create hunter with size 60
        const hunter = new Hunter(x, y, 60, speed);
        
        // Set the wave scaling to update health correctly
        hunter.setWaveScaling(this.currentWave);
        
        // Debug output
        console.log(`Spawned hunter with health: ${hunter.currentHealth}/${hunter.maxHealth}, speed: ${speed.toFixed(3)}`);
        
        this.hunters.push(hunter);
    }

    updateHunters(deltaTime) {
        if (this.waveInProgress && this.huntersToSpawn > 0) {
            const now = Date.now();
            if (now - this.lastHunterSpawn >= this.hunterSpawnInterval) {
                this.spawnHunter();
                this.lastHunterSpawn = now;
                this.huntersToSpawn--;
            }
        }

        // Initialize hit tracking set if it doesn't exist
        if (!this.hitHunters) {
            this.hitHunters = new Set();
        }

        // Update and filter hunters
        this.hunters = this.hunters.filter(hunter => {
            // Move hunter if health is above 0
            if (hunter.currentHealth > 0) {
                hunter.move(this.player.x, this.player.y, deltaTime);
            }

            // Only apply damage if we're attacking AND this hunter hasn't been hit yet in this attack
            if (this.isAttackAnimating && !this.hitHunters.has(hunter)) {
                const dx = hunter.x - this.player.x;
                const dy = hunter.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate attack range based on double range power-up
                const baseRange = this.player.size * 2; // Increased from 1.5 to 2
                const attackRange = this.hasDoubleRange ? baseRange * 2 : baseRange;
                
                if (distance < attackRange) {
                    // Apply damage
                    hunter.takeDamage(this.stats.attackDamage.value);
                    
                    // Mark this hunter as already hit during this attack
                    this.hitHunters.add(hunter);
                    
                    // Update stats if hunter died
                    if (hunter.currentHealth <= 0) {
                        this.gameStats.huntersEliminated++;
                        // Chance to spawn magnet when hunter dies
                        if (Math.random() < this.magnetDropChance) {
                            console.log('Spawning magnet from hunter death');
                            this.spawnMagnetFromHunter(hunter.x, hunter.y);
                        }
                        // Chance to spawn double range when hunter dies
                        if (Math.random() < this.doubleRangeDropChance) {
                            console.log('Spawning double range from hunter death');
                            this.spawnDoubleRangeFromHunter(hunter.x, hunter.y);
                        }
                    }
                }
            }

            // Check for collision with player
            if (hunter.checkCollision(this.player)) {
                this.playerHealth--;  // Decrease player health
                this.hearts = this.playerHealth;  // Update hearts to match current health
                hunter.currentHealth = 0;
                // Trigger screen shake when player is hit
                this.startScreenShake(25, 300);
                
                if (this.playerHealth <= 0) {
                    this.isGameOver = true;
                    this.gameStats.wavesCompleted = this.currentWave - 1;
                }
                return false;
            }

            return hunter.currentHealth > 0 || hunter.isHit;
        });

        // Check if wave is complete
        if (this.waveInProgress && this.huntersToSpawn === 0 && this.hunters.length === 0) {
            this.waveInProgress = false;
            this.showWaveAnnouncement = true;
            this.waveAnnouncementTime = Date.now();
            this.waveAnnouncementDuration = 5000;
            
            setTimeout(() => {
                this.startWave();
            }, 5000);
        }
    }

    drawWaveAnnouncement() {
        if (!this.showWaveAnnouncement) return;

        const now = Date.now();
        const elapsed = now - this.waveAnnouncementTime;
        
        if (elapsed > this.waveAnnouncementDuration) {
            this.showWaveAnnouncement = false;
            return;
        }

        // Calculate opacity for fade effect
        const opacity = Math.min(1, Math.min(elapsed / 500, (this.waveAnnouncementDuration - elapsed) / 500));
        
        this.ctx.save();
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.font = '48px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Show different messages based on timing and whether it's a wave transition
        if (this.nextWaveNumber > 1) {
            // During wave transitions (Wave 1 to 2, 2 to 3, etc.)
            if (elapsed < 3000) {
                this.ctx.fillText(`Wave ${this.nextWaveNumber - 1} Complete!`, this.canvas.width/2, this.canvas.height/2);
            } else if (elapsed >= 3000) {
                this.ctx.fillText(`Wave ${this.nextWaveNumber}`, this.canvas.width/2, this.canvas.height/2);
            }
        } else {
            // At game start, just show Wave 1
            this.ctx.fillText(`Wave ${this.nextWaveNumber}`, this.canvas.width/2, this.canvas.height/2);
        }
        
        this.ctx.restore();
    }

    drawGameOver() {
        // Draw semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw game over text
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '48px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2 - 100);

        // Draw player name
        this.ctx.font = '24px "Press Start 2P"';
        this.ctx.fillText(this.playerName, this.canvas.width/2, this.canvas.height/2 - 40);

        // Draw stats
        this.ctx.font = '20px "Press Start 2P"';
        this.drawGameOverStat('Waves Survived', this.currentWave - 1, this.canvas.height/2 + 20, 'number');
        this.drawGameOverStat('Hunters Eliminated', this.gameStats.huntersEliminated, this.canvas.height/2 + 60, 'number');
        this.drawGameOverStat('Berries Collected', this.gameStats.totalBerriesCollected, this.canvas.height/2 + 100, 'number');

        // Draw restart instruction
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillText('Press SPACE to play again', this.canvas.width/2, this.canvas.height/2 + 160);
    }

    // Add method to draw game over stats with icons
    drawGameOverStat(label, value, y, type) {
        const iconSize = 24;
        const centerX = this.canvas.width/2;
        const iconX = centerX - 150;
        
        // Draw icon based on type
        this.ctx.save();
        this.ctx.translate(iconX, y - iconSize/2);
        
        switch(type) {
            case 0: // Wave icon
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(iconSize/2, iconSize/2, iconSize/2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#000000';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('W', iconSize/2, iconSize/2);
                break;
                
            case 1: // Hunter icon
                // Hunter body
                this.ctx.fillStyle = '#444444';
                this.ctx.fillRect(0, 0, iconSize, iconSize);
                // Hunter eyes
                this.ctx.fillStyle = '#ff0000';
                const eyeSize = iconSize/6;
                this.ctx.fillRect(iconSize/4 - eyeSize/2, iconSize/4, eyeSize, eyeSize);
                this.ctx.fillRect(3*iconSize/4 - eyeSize/2, iconSize/4, eyeSize, eyeSize);
                break;
                
            case 2: // Berry icon
                if (this.berryImageLoaded) {
                    this.ctx.drawImage(this.berryImage, 0, 0, iconSize, iconSize);
                } else {
                    this.ctx.fillStyle = '#ff4444';
                    this.ctx.beginPath();
                    this.ctx.arc(iconSize/2, iconSize/2, iconSize/2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                break;
        }
        this.ctx.restore();

        // Draw text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${label}: ${value}`, centerX - 100, y);
    }

    resetGame() {
        // Reset game state
        this.hearts = this.stats.health.baseValue;
        this.berryCount = 0;
        this.currentWave = 0;
        this.waveInProgress = false;
        this.hunters = [];
        this.isGameOver = false;
        
        // Reset magnet properties
        this.magnets = [];
        this.hasMagnet = false;
        this.magnetTimeLeft = 0;
        this.magnetLastPickup = 0;

        // Reset double range properties
        this.doubleRanges = [];
        this.hasDoubleRange = false;
        this.doubleRangeTimeLeft = 0;
        this.doubleRangeLastPickup = 0;
        
        // Reset stats
        this.gameStats = {
            huntersEliminated: 0,
            totalBerriesCollected: 0,
            wavesCompleted: 0
        };

        // Reset player position
        if (this.player) {
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height / 2;
        }

        // Start new game
        this.start(this.playerName);
    }

    checkDiamondCollection() {
        if (!this.player) return;
        
        this.groundDiamonds = this.groundDiamonds.filter(diamond => {
            const dx = this.player.x - diamond.x;
            const dy = this.player.y - diamond.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.size/2 + diamond.size/2) {
                this.collectedDiamonds++;
                // Enable portals after collecting first diamond
                if (!this.portalsEnabled && this.collectedDiamonds === 1) {
                    this.portalsEnabled = true;
                }
                return false; // Remove the collected diamond
            }
            return true;
        });
    }

    // Add screen shake method
    startScreenShake(intensity = 20, duration = 500) {
        this.screenShake = {
            intensity,
            duration,
            startTime: Date.now(),
            offsetX: 0,
            offsetY: 0
        };
    }

    // Add method to update screen shake
    updateScreenShake() {
        if (this.screenShake.startTime === 0) return { x: 0, y: 0 };

        const elapsed = Date.now() - this.screenShake.startTime;
        if (elapsed >= this.screenShake.duration) {
            this.screenShake.startTime = 0;
            return { x: 0, y: 0 };
        }

        // Calculate shake intensity based on remaining duration
        const progress = elapsed / this.screenShake.duration;
        const currentIntensity = this.screenShake.intensity * (1 - progress);

        // Generate random offsets
        this.screenShake.offsetX = (Math.random() * 2 - 1) * currentIntensity;
        this.screenShake.offsetY = (Math.random() * 2 - 1) * currentIntensity;

        return {
            x: this.screenShake.offsetX,
            y: this.screenShake.offsetY
        };
    }

    // Add magnet UI drawing method
    drawMagnetUI(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);

        // Add glow effect
        const glowRadius = 25;
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw magnet body with gradient
        const bodyGradient = this.ctx.createLinearGradient(-10, -15, 10, 15);
        bodyGradient.addColorStop(0, '#ff3333');
        bodyGradient.addColorStop(0.5, '#ff0000');
        bodyGradient.addColorStop(1, '#cc0000');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(-10, -15, 20, 30);

        // Draw magnet poles with metallic effect
        const poleGradient = this.ctx.createLinearGradient(-15, 0, 15, 0);
        poleGradient.addColorStop(0, '#cccccc');
        poleGradient.addColorStop(0.5, '#ffffff');
        poleGradient.addColorStop(1, '#cccccc');
        this.ctx.fillStyle = poleGradient;

        // North pole
        this.ctx.fillRect(-15, -15, 5, 10);
        this.ctx.fillRect(10, -15, 5, 10);
        // South pole
        this.ctx.fillRect(-15, 5, 5, 10);
        this.ctx.fillRect(10, 5, 5, 10);

        // Add metallic shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(-8, -13, 4, 26);

        // Add outline
        this.ctx.strokeStyle = '#800000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-10, -15, 20, 30);
        this.ctx.strokeRect(-15, -15, 5, 10);
        this.ctx.strokeRect(-15, 5, 5, 10);
        this.ctx.strokeRect(10, -15, 5, 10);
        this.ctx.strokeRect(10, 5, 5, 10);

        // Draw timer with improved styling
        const secondsLeft = Math.ceil(this.magnetTimeLeft / 1000);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 16px "Press Start 2P"';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        // Draw text shadow
        this.ctx.strokeText(`${secondsLeft}s`, 25, 5);
        this.ctx.fillText(`${secondsLeft}s`, 25, 5);

        this.ctx.restore();
    }

    // Add method to spawn magnet from hunter
    spawnMagnetFromHunter(x, y) {
        if (Math.random() < this.magnetDropChance) {
            this.magnets.push({
                x,
                y,
                size: 20,
                collected: false,
                spawnTime: Date.now()
            });
        }
    }

    // Add method to update magnets
    updateMagnets() {
        // Update magnet timer if active
        if (this.hasMagnet) {
            const now = Date.now();
            const elapsed = now - this.magnetLastPickup;
            if (elapsed >= this.magnetDuration) {
                this.hasMagnet = false;
                this.magnetTimeLeft = 0;
            } else {
                this.magnetTimeLeft = this.magnetDuration - elapsed;
            }
        }

        // Check for magnet collection
        if (this.player) {
            this.magnets = this.magnets.filter(magnet => {
                if (magnet.collected) return false;

                const dx = this.player.x - magnet.x;
                const dy = this.player.y - magnet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.player.size/2 + magnet.size/2) {
                    this.hasMagnet = true;
                    this.magnetLastPickup = Date.now();
                    this.magnetTimeLeft = this.magnetDuration;
                    return false;
                }
                return true;
            });
        }
    }

    // Add method to draw magnets
    drawMagnets() {
        // Update animation time
        this.magnetAnimationTime = (this.magnetAnimationTime || 0) + 0.05;

        this.magnets.forEach(magnet => {
            if (magnet.collected) return;

            this.ctx.save();
            this.ctx.translate(magnet.x, magnet.y);

            // Add floating animation
            const floatOffset = Math.sin(this.magnetAnimationTime * 2) * 3;
            this.ctx.translate(0, floatOffset);

            // Add glow effect
            const glowRadius = 25;
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw magnet body with gradient
            const bodyGradient = this.ctx.createLinearGradient(-10, -15, 10, 15);
            bodyGradient.addColorStop(0, '#ff3333');
            bodyGradient.addColorStop(0.5, '#ff0000');
            bodyGradient.addColorStop(1, '#cc0000');
            this.ctx.fillStyle = bodyGradient;
            this.ctx.fillRect(-10, -15, 20, 30);

            // Draw magnet poles with metallic effect
            const poleGradient = this.ctx.createLinearGradient(-15, 0, 15, 0);
            poleGradient.addColorStop(0, '#cccccc');
            poleGradient.addColorStop(0.5, '#ffffff');
            poleGradient.addColorStop(1, '#cccccc');
            this.ctx.fillStyle = poleGradient;

            // North pole
            this.ctx.fillRect(-15, -15, 5, 10);
            this.ctx.fillRect(10, -15, 5, 10);
            // South pole
            this.ctx.fillRect(-15, 5, 5, 10);
            this.ctx.fillRect(10, 5, 5, 10);

            // Add metallic shine
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(-8, -13, 4, 26);

            // Add outline
            this.ctx.strokeStyle = '#800000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(-10, -15, 20, 30);
            this.ctx.strokeRect(-15, -15, 5, 10);
            this.ctx.strokeRect(-15, 5, 5, 10);
            this.ctx.strokeRect(10, -15, 5, 10);
            this.ctx.strokeRect(10, 5, 5, 10);

            this.ctx.restore();
        });
    }

    // Add method to draw hunter icon and kill counter
    drawHunterKillCounter(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);

        // Draw hunter icon (simplified version)
        const hunterSize = 24;
        
        // Hunter body (dark gray)
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(-hunterSize/2, -hunterSize/2, hunterSize, hunterSize);
        
        // Hunter eyes (red)
        this.ctx.fillStyle = '#ff0000';
        const eyeSize = hunterSize/6;
        this.ctx.fillRect(-hunterSize/4 - eyeSize/2, -hunterSize/4, eyeSize, eyeSize);
        this.ctx.fillRect(hunterSize/4 - eyeSize/2, -hunterSize/4, eyeSize, eyeSize);

        // Add metallic shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(-hunterSize/2 + 2, -hunterSize/2 + 2, hunterSize/4, hunterSize - 4);

        // Draw kill count with shadow
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 16px "Press Start 2P"';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        const killText = `× ${this.gameStats.huntersEliminated}`;
        this.ctx.strokeText(killText, hunterSize, 0);
        this.ctx.fillText(killText, hunterSize, 0);

        this.ctx.restore();
    }

    // Add method to draw double range UI
    drawDoubleRangeUI(x, y) {
        if (!this.hasDoubleRange) return;

        // Draw double range icon
        this.ctx.save();
        this.ctx.translate(x, y);

        // Draw circular background
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw "2x" text
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('2x', 0, 0);

        // Draw timer bar
        const barWidth = 30;
        const barHeight = 3;
        const barY = 20;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);
        
        // Progress
        const progress = this.doubleRangeTimeLeft / 10000;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(-barWidth/2, barY, barWidth * progress, barHeight);

        this.ctx.restore();
    }

    // Add method to spawn double range power-up from hunter
    spawnDoubleRangeFromHunter(x, y) {
        if (Math.random() < this.doubleRangeDropChance) {
            this.doubleRanges.push({
                x,
                y,
                size: 20,
                collected: false,
                spawnTime: Date.now()
            });
        }
    }

    // Add method to update double range power-ups
    updateDoubleRanges() {
        // Update double range power-up timers
        if (this.hasDoubleRange) {
            this.doubleRangeTimeLeft = Math.max(0, this.doubleRangeTimeLeft - 16); // 60 FPS update
            if (this.doubleRangeTimeLeft <= 0) {
                this.hasDoubleRange = false;
                console.log('Double range power-up expired');
            }
        }

        // Check for collection of new power-ups
        this.doubleRanges = this.doubleRanges.filter(powerUp => {
            if (powerUp.collected) return false;
            
            const dx = this.player.x - powerUp.x;
            const dy = this.player.y - powerUp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 30) {
                powerUp.collected = true;
                this.hasDoubleRange = true;
                this.doubleRangeTimeLeft = this.doubleRangeDuration;
                console.log('Double range power-up collected!');
                return false;
            }
            return true;
        });
    }

    drawDoubleRanges() {
        // Update animation time
        this.doubleRangeAnimationTime = (this.doubleRangeAnimationTime || 0) + 0.05;

        this.doubleRanges.forEach(powerup => {
            if (powerup.collected) return;

            this.ctx.save();
            this.ctx.translate(powerup.x, powerup.y);

            // Add floating animation
            const floatOffset = Math.sin(this.doubleRangeAnimationTime * 2) * 3;
            this.ctx.translate(0, floatOffset);

            // Draw sword icon
            const swordLength = 30;
            const swordWidth = 8;
            
            // Add glow effect
            const glowRadius = 20;
            const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
            glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Sword blade gradient
            const bladeGradient = this.ctx.createLinearGradient(-swordLength/2, 0, swordLength/2, 0);
            bladeGradient.addColorStop(0, '#cccccc');
            bladeGradient.addColorStop(0.5, '#ffffff');
            bladeGradient.addColorStop(1, '#cccccc');
            
            // Draw sword blade
            this.ctx.fillStyle = bladeGradient;
            this.ctx.fillRect(-swordLength/2, -swordWidth/2, swordLength, swordWidth);
            
            // Draw sword handle
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(-swordLength/2 - 8, -swordWidth/2 - 2, 8, swordWidth + 4);

            this.ctx.restore();
        });
    }

    drawBerrySwapperPriceTag(x, y) {
        const tagWidth = 160;
        const tagHeight = 30;
        const tagX = x - tagWidth/2;
        const tagY = y + this.berrySwapperSize/3 + 5;

        // Calculate total width of all elements
        const textWidth = 40; // Width for "10x" and "1x" text
        const berryWidth = 12; // Width for red berry
        const blueberryWidth = 16; // Width for blueberry
        const equalsWidth = 12; // Width for equals sign
        const spacing = 8; // Spacing between elements

        // Calculate starting position to center all elements
        const totalWidth = textWidth + berryWidth + equalsWidth + textWidth + blueberryWidth + (spacing * 4);
        let currentX = tagX + (tagWidth - totalWidth) / 2;

        // Draw "10x" text
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('10x', currentX, tagY + 20);
        currentX += textWidth + spacing;

        // Draw red berry
        this.drawBerry(currentX, tagY + 15, 12);
        currentX += berryWidth + spacing;

        // Draw equals sign
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillText('=', currentX, tagY + 20);
        currentX += equalsWidth + spacing;

        // Draw "1x" text
        this.ctx.fillStyle = '#FFE0B2';
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.fillText('1x', currentX, tagY + 20);
        currentX += textWidth + spacing;

        // Draw blueberry
        if (this.blueberryImage.complete) {
            this.ctx.drawImage(this.blueberryImage, currentX - 20, tagY + 7, 20, 20);
        }
    }

    drawBerrySwapper() {
        this.ctx.save();
        this.ctx.translate(this.berrySwapperPosition.x, this.berrySwapperPosition.y);
        
        // Draw building base (3x longer and taller)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-this.berrySwapperSize * 1.5, -this.berrySwapperSize/2, this.berrySwapperSize * 3, this.berrySwapperSize * 1.5);
        
        // Add wood texture (adjusted for 3x length)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < 9; i++) {
            this.ctx.fillRect(-this.berrySwapperSize * 1.5 + (i * this.berrySwapperSize/3), -this.berrySwapperSize/2, 2, this.berrySwapperSize * 1.5);
        }
        
        // Draw rotating arrows
        this.ctx.rotate(this.berrySwapperRotation);
        
        // Draw circular track
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.berrySwapperSize/3, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw arrows
        for (let i = 0; i < 2; i++) {
            this.ctx.save();
            this.ctx.rotate(i * Math.PI);
            
            // Arrow head
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.moveTo(this.berrySwapperSize/3, 0);
            this.ctx.lineTo(this.berrySwapperSize/3 - 10, -5);
            this.ctx.lineTo(this.berrySwapperSize/3 - 10, 5);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Arrow shaft
            this.ctx.fillRect(this.berrySwapperSize/3 - 15, -3, 15, 6);
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
        
        // Draw price tag below the spinning animation
        this.drawBerrySwapperPriceTag(this.berrySwapperPosition.x, this.berrySwapperPosition.y);
        
        // Draw interaction prompt if player is in range
        if (this.isNearBerrySwapper()) {
            this.drawInteractButton(this.berrySwapperPosition.x, this.berrySwapperPosition.y - this.berrySwapperSize/2 - 85);
        }

        // Draw blueberry animation if active
        if (this.blueberryAnimationActive) {
            this.drawBlueberryAnimation(this.berrySwapperPosition.x, this.berrySwapperPosition.y);
        }
    }

    isNearBerrySwapper() {
        const dx = this.player.x - this.berrySwapperPosition.x;
        const dy = this.player.y - this.berrySwapperPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.berrySwapperRange;
    }

    updateBerrySwapper() {
        // Update rotation
        this.berrySwapperRotation += this.berrySwapperRotationSpeed;
    }

    handleBerrySwapperInteraction() {
        if (this.isNearBerrySwapper() && this.berryCount >= this.berrySwapRate) {
            this.berryCount -= this.berrySwapRate;
            this.blueberryCount++;
            this.blueberryAnimationActive = true;
            this.blueberryAnimationProgress = 0;
            this.blueberryAnimationStartTime = Date.now();
        }
    }

    drawBlueberryAnimation(x, y) {
        const now = Date.now();
        const elapsed = now - this.blueberryAnimationStartTime;
        this.blueberryAnimationProgress = Math.min(elapsed / 1000, 1); // 1 second animation

        // Calculate position using easing function
        const startY = y;
        const endY = y - 100; // Move up 100 pixels
        const currentY = startY + (endY - startY) * (1 - Math.pow(1 - this.blueberryAnimationProgress, 2));

        // Calculate size and opacity
        const size = 15 + (this.blueberryAnimationProgress * 5); // Grow from 15 to 20
        const opacity = 1 - this.blueberryAnimationProgress;

        // Draw the blueberry using the blueberry image
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.drawImage(
            this.blueberryImage,
            x - size/2,
            currentY - size/2,
            size,
            size
        );
        this.ctx.restore();

        // When animation completes, add to berry count
        if (this.blueberryAnimationProgress >= 1) {
            this.berryCount++;
            this.blueberryAnimationActive = false;
        }
    }

    drawGroundItems() {
        // Draw all ground items
        this.groundItems.forEach(item => {
            if (item.type === 'diamond') {
                this.drawDiamond(item.x, item.y, item.size);
            } else if (item.type === 'blueberry') {
                this.ctx.drawImage(
                    this.blueberryImage,
                    item.x - item.size/2,
                    item.y - item.size/2,
                    item.size,
                    item.size
                );
            }
        });

        // Check for collection
        this.groundItems = this.groundItems.filter(item => {
            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 20 && !item.collected) {
                item.collected = true;
                if (item.type === 'diamond') {
                    this.collectedDiamonds++;
                } else if (item.type === 'blueberry') {
                    this.berryCount++;
                }
                return false; // Remove the item after collection
            }
            return true; // Keep the item if not collected
        });
    }

    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        this.gameOver = true;
        
        // Hide wave counter
        const waveCounter = document.getElementById('wave-counter');
        if (waveCounter) {
            waveCounter.classList.add('hidden');
        }
        
        // Rest of game over logic...
    }

    updateWave() {
        if (this.hunters.length === 0 && this.huntersToSpawn <= 0) {
            // Show wave announcement before incrementing the wave
            this.showWaveAnnouncement = true;
            this.waveAnnouncementTime = Date.now();
            this.waveAnnouncementDuration = 5000;
            this.nextWaveNumber = this.currentWave + 1; // Store the next wave number

            // Start next wave after announcement
            setTimeout(() => {
                this.currentWave = this.nextWaveNumber;
                this.waveInProgress = true;
                this.huntersToSpawn = 5 + (this.currentWave - 1) * 2;
                this.hunterSpawnInterval = Math.max(2000, 5000 - (this.currentWave - 1) * 500);
                this.waveStartTime = Date.now();
                this.lastHunterSpawn = Date.now();

                // Update wave counter
                const waveCounter = document.getElementById('wave-counter');
                if (waveCounter) {
                    waveCounter.textContent = `Wave: ${this.currentWave}`;
                }
            }, 5000);
        }
    }
} // End of Game class 