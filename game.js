// game.js

let enemies = [], projectiles = [], particles = [], resources = [];
let wave = 0, kills = 0;
let isGameRunning = false;
let totalEnemiesThisWave = 0;  // Track the remaining enemies for the wave
let shootInterval;  // Declare shootInterval globally
let spawnInterval;  // Ensure spawnInterval is declared as well
let cleanupInterval;

// Start the game
function startGame() {
    resetGame(); // Ensure the game is reset before starting
    resetTempTowerStats(); // Apply permanent stats to temporary stats before the game starts
    isGameRunning = true;
    initScene();  // Initialize the scene, which includes creating the tower and radius circle
    setShootInterval();  // Start shooting projectiles with the correct interval
    animate(); // Start the animation loop
    startWave(); // Start the first wave
    //clearInterval(cleanupInterval);
    //cleanupInterval = setInterval(cleanupLeftoverElements, 1000); 
    // Play in-game music
    playMusic('ingame');
}


// Function to set up the shooting interval based on attack speed
function setShootInterval() {
    clearInterval(shootInterval);  // Clear any existing interval
    // Calculate the new interval based on the attack speed and game speed
    const interval = (1000 / tempTowerStats.attackSpeed) / gameSpeed;
    shootInterval = setInterval(shootProjectile, interval);
}

// Function to start a wave
function startWave() {
    if (wave % 10 === 0) {
        // Spawn a boss on every 10th wave
        spawnBoss();
        totalEnemiesThisWave = Math.ceil(wave * 2 * 1.5); // 1.5x the normal amount of enemies
    } else {
        totalEnemiesThisWave = Math.ceil(wave * 2); // Regular amount of enemies for other waves
    }

    updateWaveDisplay();
    spawnEnemies(); // Start spawning regular enemies
}


// Function to spawn enemies continuously until the wave's quota is met
function spawnEnemies() {
    if (totalEnemiesThisWave > 0) {
        let geometry = new THREE.CircleGeometry(0.1, 32);
        let material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Regular enemy color
        let enemy = new THREE.Mesh(geometry, material);

        // Set enemy attributes (adjust as needed)
        enemy.health = 5 + wave * 3;
        enemy.damage = 1 + wave * 0.5;
        enemy.speed = 0.02;

        let side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0: // Top
                enemy.position.set(Math.random() * 10 - 5, 5, 0);
                break;
            case 1: // Right
                enemy.position.set(5, Math.random() * 10 - 5, 0);
                break;
            case 2: // Bottom
                enemy.position.set(Math.random() * 10 - 5, -5, 0);
                break;
            case 3: // Left
                enemy.position.set(-5, Math.random() * 10 - 5, 0);
                break;
        }

        enemies.push(enemy);
        scene.add(enemy);

        totalEnemiesThisWave--;  // Decrement the total enemies left to spawn

        // Adjust the spawn delay based on game speed or add randomization
        const spawnDelay = 500 / gameSpeed;

        // Recursively spawn more enemies
        setTimeout(spawnEnemies, spawnDelay);
    }
}

function updateHealthBar(currentHP, maxHP) {
    const hpBar = document.getElementById('hpBar');
    const hpText = document.getElementById('hpText');

    const hpPercentage = (currentHP / maxHP) * 100;
    hpBar.style.width = hpPercentage + '%';
    hpText.textContent = `${currentHP} / ${maxHP}`;
}

// Main game loop
function animate() {
    if (isGameRunning) {
        requestAnimationFrame(animate);
        updateEnemies();
        updateProjectiles();
        updateParticles();
        updateResources();
        renderScene();
        updateHPBar();
        updateStatsDisplay();
        checkWaveProgress(); // Check if the wave is complete
    }
}

// Stop the game
function stopGame() {
    isGameRunning = false;
    clearInterval(shootInterval);  // Ensure the shooting interval is cleared
    clearInterval(spawnInterval);  // Clear the spawn interval
    clearScene();
}

// Reset the game state
function resetGame() {
    kills = 0;
    wave = 1;
    resetTempTowerStats(); // Reset temporary stats to match permanent stats
    towerHP = maxTowerHP;  // Reset tower health to maximum
    commonResource = 0;
    enemies = [];
    projectiles = [];
    particles = [];
    resources = [];
    totalEnemiesThisWave = 0;
    document.getElementById('commonResource').textContent = commonResource;
    document.getElementById('rareResource').textContent = rareResource;
    updateStatsDisplay();
    if (tower) {
        updateRadiusCircle(tempTowerStats.radius);
    }
}

function resetTemporaryValues() {
    resetTempTowerStats();  // Reset temporary stats
    // Additional reset logic if needed
}

// End the game and display the run summary
function endGame() {
    // Stop the game loop
    isGameRunning = false;

    // Clear all intervals and cleanup all objects
    clearInterval(shootInterval); // Clear the shooting interval
    shootInterval = null;

    enemies.forEach(enemy => {
        if (enemy.isBoss && enemy.damageInterval) {
            clearInterval(enemy.damageInterval);
            enemy.damageInterval = null;
        }
        destroyObject(enemy); // Clean up the enemy and any associated objects
    });

    // Clean up any remaining objects in the scene
    clearScene();

    // Stop any playing sounds
    stopAllSounds();

    // Stop in-game music
    stopMusic();

    // Hide the in-game shop if it's open
    const shopElement = document.getElementById('shop');
    if (shopElement && shopElement.style.display !== 'none') {
        shopElement.style.display = 'none';
    }

    // Show the run summary
    showRunSummary();
}

// Check if the wave is complete and start a new wave
function checkWaveProgress() {
    if (totalEnemiesThisWave <= 0 && enemies.length === 0 && isGameRunning) {
        wave++;
        startWave(); // Start the next wave
    }
}

// Update enemy positions
let bossDamageInterval = null;

function updateEnemies() {
    enemies.forEach((enemy, index) => {
        if (enemy && enemy.position) {
            let direction = new THREE.Vector3(
                tower.position.x - enemy.position.x,
                tower.position.y - enemy.position.y,
                0
            ).normalize();

            if (enemy.isBoss) {
                if (enemy.position.distanceTo(tower.position) > 0.3) {
                    enemy.position.add(direction.multiplyScalar(enemy.speed * gameSpeed));
                } else {
                    if (!enemy.damageInterval) {
                        enemy.damageInterval = setInterval(() => {
                            applyBossDamage(enemy);
                        }, 1000); // 1000ms = 1 second
                    }
                }
                updateBossHealthDisplay(enemy);

                // Update particle positions to follow the boss
                if (enemy.particles) {
                    enemy.particles.forEach(particle => {
                        // Update the particle's position relative to the boss
                        particle.position.set(
                            enemy.position.x + (Math.random() - 0.5) * 0.6,
                            enemy.position.y + (Math.random() - 0.5) * 0.6,
                            enemy.position.z
                        );
                    });
                }
            } else {
                if (enemy.position.distanceTo(tower.position) > 0.3) {
                    enemy.position.add(direction.multiplyScalar(enemy.speed * gameSpeed));
                } else {
                    handleTowerHit(enemy, index);
                }
            }
        } else {
            enemies.splice(index, 1);
        }
    });
}

// Update projectile positions and handle collisions
function updateProjectiles() {
    projectiles.forEach((projectile, index) => {
        // Adjust projectile velocity by the game speed
        projectile.position.add(projectile.velocity.clone().multiplyScalar(gameSpeed));

        // Check collision with enemies
        enemies.forEach((enemy, enemyIndex) => {
            if (enemy.health > 0 && projectile.position.distanceTo(enemy.position) < 0.2) {
                towerAttack(enemy);
                scene.remove(projectile);
                projectiles.splice(index, 1);
            }
        });

        // Remove projectiles that go off-screen
        if (Math.abs(projectile.position.x) > 10 || Math.abs(projectile.position.y) > 10) {
            scene.remove(projectile);
            projectiles.splice(index, 1);
        }
    });
}

// Update particles (death effect)
function updateParticles() {
    particles.forEach((particle, index) => {
        particle.position.add(particle.velocity);
        particle.material.opacity -= 0.02;
        if (particle.material.opacity <= 0) {
            scene.remove(particle);
            particles.splice(index, 1);
        }
    });
}

// Update resources (visual movement towards tower)
function updateResources() {
    resources.forEach((resource, index) => {
        let direction = new THREE.Vector3(
            tower.position.x - resource.position.x,
            tower.position.y - resource.position.y,
            0
        ).normalize();

        resource.position.add(direction.multiplyScalar(0.05 * gameSpeed));

        if (resource.textElement) {
            // Convert the 3D position to 2D screen position
            let vector = new THREE.Vector3(resource.position.x, resource.position.y, 0);
            vector.project(camera);

            const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const screenY = (vector.y * -0.5 + 0.5) * window.innerHeight;

            resource.textElement.style.left = `${screenX}px`;
            resource.textElement.style.top = `${screenY}px`;
        }

        if (resource.position.distanceTo(tower.position) < 0.2) {
            // Play resource pickup sound
            const pickupSound = new Audio('sounds/resourcepickupsound1.mp3');
            pickupSound.play();

            if (resource.type === 'common') {
                commonResource += resource.amount;
                document.getElementById('commonResource').textContent = commonResource;
            } else if (resource.type === 'rare') {
                rareResource += resource.amount;
                document.getElementById('rareResource').textContent = rareResource;
                //document.getElementById('rareResourceShop').textContent = rareResource;
            }

            // Clean up the DOM element
            if (resource.textElement && resource.textElement.parentNode) {
                resource.textElement.parentNode.removeChild(resource.textElement);
            }

            // Remove the resource from the scene and array
            destroyObject(resource);
            resources.splice(index, 1);
        }
    });
}

// Handle damage to the tower
function handleTowerHit(enemy, index) {
    if (enemy.isBoss) {
        if (enemy.health <= 0) {
            // Stop the damage interval when the boss dies
            if (enemy.damageInterval) {
                clearInterval(enemy.damageInterval);
                enemy.damageInterval = null;
            }

            // Remove the boss health text
            if (enemy.healthElement && enemy.healthElement.parentNode) {
                enemy.healthElement.parentNode.removeChild(enemy.healthElement);
            }

            // Remove the boss from the scene and cleanup
            destroyObject(enemy);
            enemies.splice(index, 1);
        }
    } else {
        // Handle regular enemies as usual
        let damage = Math.max(0, enemy.damage - tempTowerStats.defense);
        towerHP -= damage;
        showDamage(tower.position.x, tower.position.y, damage, 'red');

        // Remove the enemy from the scene
        destroyObject(enemy);
        enemies.splice(index, 1);

        if (towerHP <= 0) {
            endGame();
        }
    }
}

// Handle tower attack
function towerAttack(enemy) {
    let isCrit = Math.random() < tempTowerStats.critChance;
    let damage = tempTowerStats.attack * (isCrit ? tempTowerStats.critMultiplier : 1);
    enemy.health -= damage;
    showDamage(enemy.position.x, enemy.position.y, damage, isCrit ? 'yellow' : 'white'); // Show damage when enemy is hit

    if (enemy.health <= 0) {
        // Play enemy death sound
        const deathSound = new Audio('sounds/enemydeathsound1.mp3');
        deathSound.play();

        // Remove the enemy from the scene and stop further interactions
        destroyObject(enemy);

        // Ensure enemy is fully removed from the enemies array
        let index = enemies.indexOf(enemy);
        if (index > -1) {
            enemies.splice(index, 1);
        }

        // Drop resources only once after the enemy is destroyed
        dropResource(enemy.position.x, enemy.position.y, 'common', getResourceReward());

        if (Math.random() < 0.1) { // 10% chance to drop rare resource
            dropResource(enemy.position.x, enemy.position.y, 'rare', 1);
        }

        // Check for poison drop
        if (Math.random() < tempTowerStats.poisonChance) {
            createPoisonArea(enemy.position);
        }

        // Spawn death particles
        spawnDeathParticles(enemy.position.x, enemy.position.y);

        // Apply lifesteal if available
        if (tempTowerStats.lifesteal > 0) {
            towerHP = Math.min(maxTowerHP, towerHP + (damage * tempTowerStats.lifesteal));
            updateHPBar();
        }
    }
}

// Spawn death particles
function spawnDeathParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        let geometry = new THREE.CircleGeometry(0.05, 32);
        let material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 1 });
        let particle = new THREE.Mesh(geometry, material);
        particle.position.set(x, y, 0);

        let direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
             0
        ).normalize().multiplyScalar(0.05);

        particle.velocity = direction;
        particles.push(particle);
        scene.add(particle);
    }
}

// Drop resource and animate its movement to the tower
function dropResource(x, y, type, amount) {
    // Create a diamond shape for the resource
    let shape = new THREE.Shape();
    shape.moveTo(0, 0.1);  // Top vertex
    shape.lineTo(0.1, 0);  // Right vertex
    shape.lineTo(0, -0.1); // Bottom vertex
    shape.lineTo(-0.1, 0); // Left vertex
    shape.lineTo(0, 0.1);  // Close the shape

    let geometry = new THREE.ShapeGeometry(shape);
    let material = new THREE.MeshPhongMaterial({ 
        color: type === 'common' ? 0x00ff00 : 0x800080, // Green for common, purple for rare
        specular: 0xffffff, 
        shininess: 100 
    });

    let resource = new THREE.Mesh(geometry, material);
    resource.position.set(x, y, 0);
    resource.type = type;
    resource.amount = amount;

    // Create a DOM element for the resource text
    let resourceTextElement = document.createElement('div');
    resourceTextElement.className = 'resource-text';
    resourceTextElement.style.position = 'absolute';
    resourceTextElement.style.color = 'white';
    resourceTextElement.textContent = amount.toString();
    document.body.appendChild(resourceTextElement);

    // Attach the DOM element to the resource object for easy tracking
    resource.textElement = resourceTextElement;

    resources.push(resource);
    scene.add(resource);
}

// Tower automatically shoots the closest enemy within range
function shootProjectile() {
    if (enemies.length === 0) return;

    // Find the closest enemy within attack radius
    let closestEnemy = enemies.reduce((closest, enemy) => {
        let distanceToClosest = closest ? closest.position.distanceTo(tower.position) : Infinity;
        let distanceToEnemy = enemy.position.distanceTo(tower.position);
        return distanceToEnemy < distanceToClosest && distanceToEnemy <= tempTowerStats.radius ? enemy : closest;
    }, null);

    if (!closestEnemy) return;

    // Create a projectile
    let geometry = new THREE.SphereGeometry(0.05, 16, 16);
    let material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    let projectile = new THREE.Mesh(geometry, material);
    projectile.position.set(tower.position.x, tower.position.y, 0);

    // Calculate velocity vector towards the closest enemy
    let direction = new THREE.Vector3(
        closestEnemy.position.x - tower.position.x,
        closestEnemy.position.y - tower.position.y,
        0
    ).normalize();

    projectile.velocity = direction.multiplyScalar(0.1); // Initial speed of the projectile
    projectiles.push(projectile);
    scene.add(projectile);

    // Play shooting sound
    const audio = new Audio('sounds/towershootsound1.mp3');
    audio.play();
}

// function showDamage(x, y, damageValue) {
    // const splash = document.createElement('div');
    // splash.classList.add('damage-splash');
    // splash.textContent = damageValue;

    // Position the splash at the specified (x, y) coordinates
    // splash.style.left = `${x}px`;
    // splash.style.top = `${y}px`;

    // Generate small random movement
    // const moveX = (Math.random() - 0.5) * 10; // Between -5 and 5 pixels
    // const moveY = (Math.random() - 0.5) * 10; // Between -5 and 5 pixels

    // Apply the movement as CSS variables
    // splash.style.setProperty('--moveX', `${moveX}px`);
    // splash.style.setProperty('--moveY', `${moveY}px`);

    // Append to the game UI or any relevant container
    // document.getElementById('gameUI').appendChild(splash);

    // Remove the splash after the animation ends
    // setTimeout(() => {
        // splash.remove();
    // }, 1000); // Match the duration of the animation (1 second)
// }

// Show damage on screen
function showDamage(x, y, damage, color) {
    // Create the damage element
    let damageElement = document.createElement('div');
    damageElement.className = 'damage-splash';
    damageElement.style.color = color; // Set the color passed in the argument
    damageElement.textContent = formatNumber(damage); // Format the damage number

    // Calculate the screen position from the 3D coordinates
    let vector = new THREE.Vector3(x, y, 0);
    vector.project(camera);

    const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (vector.y * -0.5 + 0.5) * window.innerHeight;

    // Position the damage element on the screen
    damageElement.style.position = 'absolute';
    damageElement.style.left = `${screenX}px`;
    damageElement.style.top = `${screenY}px`;
    damageElement.style.zIndex = '1000'; // Ensure it's above everything else

    // Generate small random movement offsets
    const moveX = (Math.random() - 0.5) * 10; // Between -5 and 5 pixels
    const moveY = (Math.random() - 0.5) * 10; // Between -5 and 5 pixels

    // Apply the random movement as CSS variables
    damageElement.style.setProperty('--moveX', `${moveX}px`);
    damageElement.style.setProperty('--moveY', `${moveY}px`);

    // Append the damage element to the body
    document.body.appendChild(damageElement);

    // Remove the element after the animation ends (1 second)
    setTimeout(() => {
        document.body.removeChild(damageElement);
    }, 1000);
}

// Show the run summary after the game ends
function showRunSummary() {
    // Check if the elements exist before accessing them
    const summaryKillsElement = document.getElementById('summaryKills');
    const summaryWavesElement = document.getElementById('summaryWaves');

    if (summaryKillsElement && summaryWavesElement) {
        summaryKillsElement.textContent = kills;
        summaryWavesElement.textContent = wave - 1; // Display completed waves
    } else {
        console.error("Run Summary elements not found in the DOM.");
    }

    document.getElementById('gameUI').style.display = 'none'; // Hide game UI
    document.getElementById('runSummary').style.display = 'block'; // Show run summary
}

// Function to remove the canvas
function removeCanvas() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.remove(); // Remove the canvas element if it exists
    }
}

// Function to reset all temporary values for the current run
function resetTemporaryValues() {
    kills = 0;
    wave = 0;
    totalEnemiesThisWave = 0;
    towerHP = maxTowerHP;
    commonResource = 0;
    enemies = [];
    projectiles = [];
    particles = [];
    resources = [];
    clearInterval(shootInterval);  // Clear shooting interval
    clearInterval(spawnInterval);  // Clear spawning interval

    // Update UI elements to reflect reset values
    document.getElementById('commonResource').textContent = commonResource;
    document.getElementById('rareResource').textContent = rareResource;
    document.getElementById('currentWave').textContent = wave;
    updateHPBar();  // Reset the HP bar to full
    updateStatsDisplay();  // Update the stats display
}

// Cleanup function to destroy the game scene and return to the main menu
function returnToMenu() {
    // Stop any running game logic
    stopGame();

    // Clear the scene and remove the canvas
    clearScene();
    removeCanvas();

    // Reset all temporary values
    resetTemporaryValues();

    // Hide the run summary and show the main menu
    document.getElementById('runSummary').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    document.getElementById('rareResourceMenu').textContent = rareResource; // Update rare resources in the menu
}

// Update the wave display
function updateWaveDisplay() {
    document.getElementById('currentWave').textContent = wave;
}

function spawnBoss() {
    let geometry = new THREE.CircleGeometry(0.3, 32); // Larger size for boss
    let material = new THREE.MeshBasicMaterial({ color: getRandomBossColor() });
    let boss = new THREE.Mesh(geometry, material);

    // Set boss attributes
    boss.health = 50 + wave * 10; // Base health increases significantly per wave
    boss.damage = 5 + wave * 1;   // Base damage scales with wave
    boss.speed = 0.01; // Slower speed than regular enemies
    boss.isBoss = true;

    // Position boss at a random side
    let side = Math.floor(Math.random() * 4);
    switch (side) {
        case 0: // Top
            boss.position.set(Math.random() * 10 - 5, 5, 0);
            break;
        case 1: // Right
            boss.position.set(5, Math.random() * 10 - 5, 0);
            break;
        case 2: // Bottom
            boss.position.set(Math.random() * 10 - 5, -5, 0);
            break;
        case 3: // Left
            boss.position.set(-5, Math.random() * 10 - 5, 0);
            break;
    }

    // Add boss to the scene
    enemies.push(boss);
    scene.add(boss);

addEventListener(boss, 'removed', function() {
        if (boss.healthElement && boss.healthElement.parentNode) {
            boss.healthElement.parentNode.removeChild(boss.healthElement);
        }
    });

    // Add health display
    createBossHealthDisplay(boss);

    // Create particle effects for the boss
    createBossParticleEffects(boss);

    return boss;
}

function applyBossDamage(boss) {
    // Check if the boss is still valid (not destroyed)
    if (!boss || !boss.position) {
        // Clear the interval if the boss no longer exists
        if (boss && boss.damageInterval) {
            clearInterval(boss.damageInterval);
            boss.damageInterval = null;
        }
        return; // Exit the function early
    }

    let damage = Math.max(0, boss.damage - tempTowerStats.defense); // Calculate damage, reduced by defense
    towerHP -= damage;
    showDamage(tower.position.x, tower.position.y, damage, 'red'); // Show damage when tower is hit
    updateHPBar();

    if (towerHP <= 0) {
        endGame();
        if (boss.damageInterval) {
            clearInterval(boss.damageInterval); // Ensure the interval is cleared if the game ends
            boss.damageInterval = null;
        }
    }
}


function getRandomBossColor() {
    const colors = [0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff]; // Exclude red
    return colors[Math.floor(Math.random() * colors.length)];
}
function createBossHealthDisplay(boss) {
    let healthElement = document.createElement('div');
    healthElement.className = 'boss-health';
    healthElement.style.position = 'absolute';
    healthElement.style.color = 'white';
    healthElement.style.zIndex = '1000';
    healthElement.style.fontSize = '16px';
    document.body.appendChild(healthElement);

    boss.healthElement = healthElement;

    updateBossHealthDisplay(boss);
}

function updateBossHealthDisplay(boss) {
    if (boss.healthElement) {
        let vector = new THREE.Vector3(boss.position.x, boss.position.y, 0);
        vector.project(camera);

        const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (vector.y * -0.5 + 0.5) * window.innerHeight;

        boss.healthElement.style.left = `${screenX}px`;
        boss.healthElement.style.top = `${screenY - 20}px`;
        boss.healthElement.textContent = `HP: ${Math.round(boss.health)}`;
    }
}

function createBossParticleEffects(boss) {
    boss.particles = [];

    for (let i = 0; i < 20; i++) {
        let geometry = new THREE.CircleGeometry(0.05, 32);
        let material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        let particle = new THREE.Mesh(geometry, material);
        
        // Position particles relative to the boss
        particle.position.set(
            boss.position.x + (Math.random() - 0.5) * 0.6,
            boss.position.y + (Math.random() - 0.5) * 0.6,
            boss.position.z
        );

        // Attach velocity to simulate floating effects
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            0
        );

        boss.particles.push(particle);
        scene.add(particle);
    }
}

function destroyObject(object) {
    if (object && object.damageInterval) {
        clearInterval(object.damageInterval);
        object.damageInterval = null;
    }

    if (object && object.textElement) {
        if (object.textElement.parentNode) {
            object.textElement.parentNode.removeChild(object.textElement);
        }
        object.textElement = null;
    }

    if (object && object.healthElement) {
        if (object.healthElement.parentNode) {
            object.healthElement.parentNode.removeChild(object.healthElement);
        }
        object.healthElement = null;
    }

    if (object && object.particles) {
        object.particles.forEach(particle => {
            scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        });
        object.particles = null;
    }

    if (object && object.parent) {
        object.parent.remove(object);
    }

    if (object && object.geometry) object.geometry.dispose();
    if (object && object.material) object.material.dispose();

    object = null;
}

// Add an event listener to the object
function addEventListener(object, eventName, callback) {
    if (!object.events) {
        object.events = {};
    }
    object.events[eventName] = callback;
}

function cleanupLeftoverElements() {
    // Check and remove any leftover text meshes in the scene
    scene.children.forEach(child => {
        if (child.isTextMesh && !child.isAttached) {
            scene.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
    });

    // Check and remove any leftover DOM elements
    const leftoverElements = document.querySelectorAll('.boss-health, .resource-text'); // Use the appropriate classes or IDs
    leftoverElements.forEach(element => {
        if (!element.isAttached) {
            element.remove();
        }
    });
}

function stopAllSounds() {
    // Assuming you have a global or easily accessible reference to playing audio objects
    const sounds = document.querySelectorAll('audio');
    sounds.forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
    });
}

// Poison-related constants
const poisonDuration = 5000;  // Poison lasts for 5 seconds
const poisonTickInterval = 250;  // Poison ticks every 0.25 seconds

// Function to apply poison effect to enemies within the poison area
function applyPoisonEffect(poisonArea) {
    const startTime = Date.now();
    const poisonInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= poisonDuration) {
            clearInterval(poisonInterval);
            scene.remove(poisonArea);
            return;
        }

        enemies.forEach(enemy => {
            if (enemy.position.distanceTo(poisonArea.position) <= tempTowerStats.poisonRadius) {
                enemy.health -= tempTowerStats.poisonDamage;
                if (enemy.health <= 0) {
                    // Handle enemy death
                    dropResource(enemy.position.x, enemy.position.y, 'common', getResourceReward());
                    destroyObject(enemy);
                }
            }
        });
    }, poisonTickInterval);
}

// Function to create a poison area when an enemy dies
function createPoisonArea(position) {
    const geometry = new THREE.CircleGeometry(tempTowerStats.poisonRadius, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00, // Green color for poison area
        transparent: true,
        opacity: 0.3 // Semi-transparent
    });
    const poisonArea = new THREE.Mesh(geometry, material);
    poisonArea.position.copy(position);
    scene.add(poisonArea);

    // Apply the poison effect to nearby enemies
    applyPoisonEffect(poisonArea);
}

function getResourceReward() {
    // Example logic to determine reward; you can adjust this as needed
    return Math.floor(Math.random() * (wave + 2)) + 1; // Scale the reward based on the wave
}

function formatNumber(num) {
    return num % 1 === 0 ? num.toString() : num.toFixed(1);
}