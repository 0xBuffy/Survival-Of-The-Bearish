import { bearImageURL } from './bearImage.js';

export class Player {
    constructor(x, y, size = 30, speed = 5) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.direction = 1;
        this.isAttacking = false;
        this.attackStartTime = 0;
        this.attackDuration = 300;
        this.attackCooldown = 1000;
        this.armAngle = 0;
        this.attackProgress = 0;
        
        // Load the bear image
        this.bearImage = new Image();
        this.bearImage.src = './assets/coolbear.png';
        this.imageLoaded = false;
        this.bearImage.onload = () => {
            this.imageLoaded = true;
            console.log('Bear image loaded successfully');
        };
    }

    move(keys, deltaTime) {
        // Base movement vector
        let dx = 0;
        let dy = 0;
        
        // Calculate movement direction
        if (keys.w) dy -= 1;
        if (keys.s) dy += 1;
        if (keys.a) {
            dx -= 1;
            this.direction = -1;
        }
        if (keys.d) {
            dx += 1;
            this.direction = 1;
        }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        // Apply movement with constant speed
        const nextX = this.x + dx * this.speed * deltaTime;
        const nextY = this.y + dy * this.speed * deltaTime;

        // Keep player in bounds
        const canvas = document.getElementById('game-canvas');
        const minX = this.size / 2;
        const maxX = canvas.width - this.size / 2;
        const minY = this.size / 2;
        const maxY = canvas.height - this.size / 2;

        const boundedX = Math.max(minX, Math.min(maxX, nextX));
        const boundedY = Math.max(minY, Math.min(maxY, nextY));

        // Check pond collision before updating position
        if (!window.game.checkPondCollision(boundedX, boundedY)) {
            this.x = boundedX;
            this.y = boundedY;
        }

        // Update arm angle based on mouse position if attacking
        if (this.isAttacking) {
            const dx = window.game.mouseX - this.x;
            const dy = window.game.mouseY - this.y;
            this.armAngle = Math.atan2(dy, dx);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw attack animation if active
        if (this.isAttacking) {
            this.drawAttackAnimation(ctx);
        }
        
        // Scale based on direction
        ctx.scale(this.direction, 1);
        
        // Draw the bear image
        if (this.imageLoaded) {
            const drawSize = this.size * 1.5;
            ctx.drawImage(
                this.bearImage,
                -drawSize/2,
                -drawSize/2,
                drawSize,
                drawSize
            );
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    drawAttackAnimation(ctx) {
        // Calculate attack progress (0 to 1)
        const currentTime = Date.now();
        this.attackProgress = Math.min(1, (currentTime - this.attackStartTime) / this.attackDuration);
        
        if (this.attackProgress >= 1) {
            this.isAttacking = false;
            return;
        }

        ctx.save();
        
        // Calculate arm angle based on mouse position
        const dx = window.game.mouseX - this.x;
        const dy = window.game.mouseY - this.y;
        this.armAngle = Math.atan2(dy, dx);
        ctx.rotate(this.armAngle);
        
        // Arm properties
        const baseArmLength = this.size * 1.5;
        const armLength = window.game.hasDoubleRange ? baseArmLength * 2 : baseArmLength;
        const armWidth = this.size / 3;
        
        // Smooth extension animation
        const extensionProgress = Math.sin(this.attackProgress * Math.PI);
        const currentLength = armLength * extensionProgress;
        
        // Draw arm shadow
        ctx.save();
        ctx.translate(currentLength, 0);
        ctx.rotate(-this.armAngle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-armWidth/2, -armWidth/2, armWidth, armWidth);
        ctx.restore();
        
        // Draw arm
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-armWidth/4, -armWidth/2, currentLength + armWidth/2, armWidth);
        
        // Draw hand
        ctx.beginPath();
        ctx.arc(currentLength, 0, armWidth/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw claw marks
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        const clawSpacing = 4;
        const clawLength = 8;
        
        for (let i = -1; i <= 1; i++) {
            const clawY = i * clawSpacing;
            ctx.beginPath();
            ctx.moveTo(currentLength + armWidth/2, clawY);
            ctx.lineTo(currentLength + armWidth/2 + clawLength, clawY);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    startAttack(mouseX, mouseY) {
        if (!this.isAttacking) {
            console.log('Player starting attack...');
            this.isAttacking = true;
            this.attackStartTime = Date.now();
            this.attackProgress = 0;
            
            // Calculate arm angle based on mouse position
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            this.armAngle = Math.atan2(dy, dx);
            
            // Set timeout to end attack
            setTimeout(() => {
                console.log('Player attack animation ending...');
                this.isAttacking = false;
                this.attackProgress = 0;
            }, this.attackDuration);
        }
    }
} 