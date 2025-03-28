export class Hunter {
    constructor(x, y, size, speed) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.isHit = false;
        this.hitStartTime = 0;
        this.hitDuration = 500;
        this.rotation = 0;
        this.image = new Image();
        this.image.src = './assets/hunterKnife.png';
        
        // Health system - simple and clear
        this.maxHealth = 10; // Starting base health of 10
        this.currentHealth = this.maxHealth;
        
        // Damage numbers display
        this.damageNumbers = [];
    }

    takeDamage(amount) {
        // Track health before damage for logging
        const healthBefore = this.currentHealth;
        
        // Set hit effect BEFORE changing health
        this.isHit = true;
        this.hitStartTime = Date.now();
        
        // Simple damage calculation - never go below 0
        this.currentHealth -= amount;
        if (this.currentHealth < 0) this.currentHealth = 0;
        
        // Log the damage and new health
        console.log(`Hunter took ${amount} damage: ${healthBefore} -> ${this.currentHealth}`);
        
        // Show damage number
        this.damageNumbers.push({
            value: amount,
            x: this.x,
            y: this.y - this.size,
            opacity: 1,
            offsetY: 0
        });
    }

    draw(ctx) {
        // If health is 0 but hit effect is still active, draw the hunter with hit effect
        // Otherwise, don't draw if health is 0
        if (this.currentHealth <= 0 && !this.isHit) {
            console.log("Hunter not drawn - health is 0 and no hit effect");
            return;
        }

        // Log that we're drawing this hunter
        console.log(`Drawing hunter with health: ${this.currentHealth}/${this.maxHealth}, hit effect: ${this.isHit}`);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw hunter image
        if (this.image.complete) {
            // Update hit state after duration
            if (this.isHit && Date.now() - this.hitStartTime > this.hitDuration) {
                this.isHit = false;
                // If health is 0 and hit effect is over, don't draw next frame
                if (this.currentHealth <= 0) {
                    console.log("Hunter hit effect finished and health is 0 - will be removed");
                }
            }

            if (this.isHit) {
                console.log("Drawing hunter with hit effect");
                // Create temporary canvas for hit effect
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.size;
                tempCanvas.height = this.size;
                const tempCtx = tempCanvas.getContext('2d');

                // Draw hunter on temporary canvas
                tempCtx.drawImage(this.image, 0, 0, this.size, this.size);
                
                // Apply red tint effect
                const imageData = tempCtx.getImageData(0, 0, this.size, this.size);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] > 0) {
                        data[i] = Math.min(255, data[i] + 100);
                        data[i + 1] *= 0.5;
                        data[i + 2] *= 0.5;
                    }
                }
                
                tempCtx.putImageData(imageData, 0, 0);
                ctx.drawImage(tempCanvas, -this.size/2, -this.size/2, this.size, this.size);
            } else {
                ctx.drawImage(this.image, -this.size/2, -this.size/2, this.size, this.size);
            }
        }

        // Always draw health bar if health is above 0
        if (this.currentHealth > 0) {
            this.drawHealthBar(ctx);
        }
        
        // Draw damage numbers
        this.updateAndDrawDamageNumbers(ctx);

        ctx.restore();
    }

    drawHealthBar(ctx) {
        const barWidth = this.size * 1.2;
        const barHeight = 6;
        const barY = -this.size/2 - 15;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);

        // Health fill
        const healthPercent = this.currentHealth / this.maxHealth;
        const fillWidth = barWidth * healthPercent;
        
        ctx.fillStyle = this.getHealthColor(healthPercent);
        ctx.fillRect(-barWidth/2, barY, fillWidth, barHeight);

        // Border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth/2, barY, barWidth, barHeight);

        // Health text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(this.currentHealth)}/${this.maxHealth}`, 0, barY - 2);
    }

    getHealthColor(percentage) {
        if (percentage > 0.6) return '#00FF00';
        if (percentage > 0.3) return '#FFFF00';
        return '#FF0000';
    }

    updateAndDrawDamageNumbers(ctx) {
        const speed = 1;
        const fadeSpeed = 0.02;
        
        this.damageNumbers = this.damageNumbers.filter(number => {
            number.offsetY -= speed;
            number.opacity -= fadeSpeed;
            
            if (number.opacity <= 0) return false;
            
            ctx.save();
            ctx.fillStyle = `rgba(255, 0, 0, ${number.opacity})`;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(number.value.toString(), 0, number.offsetY);
            ctx.restore();
            
            return true;
        });
    }

    setWaveScaling(wave) {
        // Health scaling pattern:
        // Waves 1-4: Base health of 10
        // Wave 5: Health increases to 15
        // Every 2 waves after 5: Health increases by 5

        let baseHealth;
        
        if (wave < 5) {
            // Waves 1-4: Fixed health of 10
            baseHealth = 10;
        } else if (wave === 5) {
            // Wave 5: Jump to 15 health
            baseHealth = 15;
        } else {
            // After wave 5: Start at 15 and increase by 5 every 2 waves
            const wavesSince5 = wave - 5;
            const healthIncreases = Math.floor(wavesSince5 / 2);
            baseHealth = 15 + (healthIncreases * 5);
        }
        
        // Set the hunter's health
        this.maxHealth = baseHealth;
        this.currentHealth = this.maxHealth;
        
        // Log the new health for this wave
        console.log(`Wave ${wave} hunter health set to ${this.maxHealth}`);
    }

    move(playerX, playerY, deltaTime) {
        // Only move if health is above 0
        if (this.currentHealth <= 0) return;
        
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const angle = Math.atan2(dy, dx);
        
        this.rotation = angle;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        }
    }

    checkCollision(player) {
        // Only check collision if health is above 0
        if (this.currentHealth <= 0) return false;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (player.size + this.size) / 2;
    }
} 