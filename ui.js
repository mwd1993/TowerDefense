// ui.js

// Assuming these variables are defined in utils.js
// No need to redefine them; just use them directly
// These include: commonResource, rareResource, tempTowerStats, towerStats, towerHP, maxTowerHP

// Game speed initialization (if not done in utils.js)
let gameSpeed = 1; // Default game speed

// Function to check if the game is active (i.e., if a Three.js canvas exists)
function isGameActive() {
    const canvas = document.querySelector('canvas');
    console.log("isGameActive() called. Canvas exists:", canvas !== null);
    return canvas !== null;
}

// Log the contents of shopItems to verify it's populated
console.log("shopItems:", shopItems);

// Event Listeners
document.getElementById('playButton').onclick = () => {
    document.getElementById('menu').style.display = 'none'; // Hide the main menu
    document.getElementById('gameUI').style.display = 'block'; // Show the game UI
    startGame(); // Start the game
};

document.getElementById('faqButton').onclick = () => {
    document.getElementById('faqModal').style.display = 'block'; // Show the FAQ modal
};

// Close FAQ modal
document.querySelector('.modal .close').onclick = () => {
    document.getElementById('faqModal').style.display = 'none'; // Hide the FAQ modal
};

// Run summary close button
document.getElementById('closeSummaryButton').onclick = () => {
    returnToMenu(); // Reset the game and return to the main menu
};

document.getElementById('endRunButton').onclick = function() {
    endGame(); // This function should handle the game ending logic
};

// Overhauled Shop UI Creation System
function createShopUI() {
    const shopContainer = document.getElementById('shop');

    // Clear existing content before creating new elements
    shopContainer.innerHTML = '';

    // Create a new wrapper for the shop content
    const scrollContainer = document.createElement('div');
    scrollContainer.id = 'shopScrollContainer';
    scrollContainer.style.overflowY = 'auto';
    scrollContainer.style.height = '85%'; // Adjust height as needed

    const shownItems = new Set();

    const inGame = isGameActive();
    console.log("Creating shop UI. In-game:", inGame);

    for (let key in shopItems) {
        let item = shopItems[key];

        if (shownItems.has(item.stat)) continue;

        let button;
        if (inGame && (item.shopType === 'temporary' || item.shopType === 'both')) {
            button = createShopButton(item, 'temp');
            scrollContainer.appendChild(button);
        } else if (!inGame && (item.shopType === 'permanent' || item.shopType === 'both')) {
            button = createShopButton(item, 'perm');
            scrollContainer.appendChild(button);
        }

        shownItems.add(item.stat);
    }

    shopContainer.appendChild(scrollContainer);

    // Create the Back button
    const backButton = document.createElement('button');
    backButton.id = 'backButton';
    backButton.innerText = 'Back';
    backButton.style.marginTop = '10px';
    backButton.style.width = '100%';
    backButton.onclick = () => {
        document.getElementById('shop').style.display = 'none';
        if (inGame) {
            document.getElementById('statsContainer').style.display = 'block';
        } else {
            document.getElementById('menu').style.display = 'block';
        }
    };

    // Append the Back button outside the scrollable container
    shopContainer.appendChild(backButton);
}

// Function to create a shop button based on type
function createShopButton(item, type) {
    let button = document.createElement('button');
    button.classList.add('tooltip');

    // Set data attributes and inner HTML
    button.setAttribute('data-stat', item.stat);
    button.innerHTML = `${type === 'temp' ? 'Increase' : 'Upgrade'} ${item.name} (Cost: <span id="${item.stat}Cost">${item.cost}</span>)`;

    // Set background color for temporary items
    if (type === 'temp') {
        button.classList.add('tempUpgradeButton');
        button.style.backgroundColor = 'red'; // Red background for temporary items
    } else {
        button.classList.add('upgradeButton');
    }

    // Create and add tooltip
    let tooltip = document.createElement('span');
    tooltip.classList.add('tooltiptext');
    tooltip.id = `${item.stat}${type === 'temp' ? 'Temp' : ''}Tooltip`;
    tooltip.innerHTML = item.description;

    button.appendChild(tooltip);

    // Bind click event for the button
    button.onclick = () => {
        if (type === 'temp') {
            purchaseTempUpgrade(item.stat);
        } else {
            purchasePermUpgrade(item.stat);
        }
    };

    return button;
}

// Purchase temporary upgrade
function purchaseTempUpgrade(stat) {
    const item = shopItems[stat];
    const currentCost = getStatCost(tempTowerStats[stat]);
    console.log("clicking temp upgrade");

    // Check if the player has enough resources to purchase the upgrade
    if (commonResource >= currentCost) {
        // Deduct the cost from the player's resources
        commonResource -= currentCost;

        // Apply the upgrade to the temporary stats
        tempTowerStats[stat] += item.value;

        // Update the UI to reflect the new resource count and stat values
        document.getElementById('commonResource').textContent = commonResource;
        updateStatsDisplay();

        // If the upgrade affects attack speed or radius, update related game mechanics
        if (stat === 'attackSpeed') {
            setShootInterval(); // Adjust the shooting interval based on the new attack speed
        }

        if (stat === 'radius') {
            updateRadiusCircle(tempTowerStats.radius); // Adjust the tower's attack radius
        }

        // Update the tooltips to reflect the new cost after purchase
        updateUpgradeTooltips();
    } else {
        console.log('Not enough resources for this upgrade.');
    }
}

// Purchase permanent upgrade
function purchasePermUpgrade(stat) {
    const item = shopItems[stat];
    const costElement = document.getElementById(`${stat}Cost`);
    const cost = parseInt(costElement.textContent);

    // Check if the player has enough resources to purchase the upgrade
    if (rareResource >= cost) {
        // Deduct the cost from the player's resources
        rareResource -= cost;

        // Apply the upgrade to the permanent stats
        towerStats[stat] += item.value;
        tempTowerStats[stat] = towerStats[stat];

        // Update the UI to reflect the new resource count and stat values
        document.getElementById('rareResource').textContent = rareResource;
        costElement.textContent = cost + 1; // Increase cost for next upgrade
        updateStatsDisplay();

        // If the upgrade affects attack speed or radius, update related game mechanics
        if (stat === 'attackSpeed') {
            setShootInterval();
        }

        if (stat === 'radius') {
            updateRadiusCircle(towerStats.radius);
        }
    } else {
        console.log('Not enough resources for this upgrade.');
    }
}

function updateHPBar() {
    const hpBar = document.getElementById('hpBar');
    hpBar.style.width = (towerHP / maxTowerHP * 100) + '%';
    if (towerHP / maxTowerHP > 0.5) {
        hpBar.style.backgroundColor = 'green';
    } else if (towerHP / maxTowerHP > 0.25) {
        hpBar.style.backgroundColor = 'yellow';
    } else {
        hpBar.style.backgroundColor = 'red';
    }
}

function updateStatsDisplay() {
    const statsList = document.getElementById('statsList');
    statsList.innerHTML = `
        <li>Attack: ${tempTowerStats.attack}</li>
        <li>Attack Speed: ${tempTowerStats.attackSpeed} /sec</li>
        <li>Defense: ${tempTowerStats.defense}</li>
        <li>Crit Chance: ${Math.round(tempTowerStats.critChance * 100)}%</li>
        <li>Crit Multiplier: ${tempTowerStats.critMultiplier}x</li>
        <li>Lifesteal: ${Math.round(tempTowerStats.lifesteal * 100)}%</li>
        <li>Radius: ${tempTowerStats.radius}</li>
        <li>Poison Chance: ${Math.round(tempTowerStats.poisonChance * 100)}%</li>
        <li>Poison Radius: ${tempTowerStats.poisonRadius}</li>
        <li>Poison Damage: ${tempTowerStats.poisonDamage}</li>
    `;
}

function showDeathScreen() {
    document.getElementById('gameUI').style.display = 'none';
    document.getElementById('deathScreen').style.display = 'block';
    document.getElementById('totalKills').textContent = kills;
    document.getElementById('totalWaves').textContent = wave - 1;
}

function hideDeathScreen() {
    document.getElementById('deathScreen').style.display = 'none';
}

function showMainMenu() {
    document.getElementById('gameUI').style.display = 'none';
    document.getElementById('deathScreen').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    document.getElementById('rareResourceMenu').textContent = rareResource;
}

function updateRadiusCircle(radius) {
    if (tower) {
        if (radiusCircle) {
            scene.remove(radiusCircle);
        }
        createRadiusCircle(radius);
    } else {
        console.error("Cannot update radius circle as tower is not initialized.");
    }
}

function removeCanvas() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.remove();
    }
}

// Function to scale the cost of upgrading stats
function getStatCost(currentValue) {
    return Math.floor(1 + (currentValue * 0.5)); // Example scaling formula for cost
}

// Event Listener for In-game Shop (Temporary Upgrades)
document.getElementById('upgradeButton').onclick = () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('shop').style.display = 'block';
    createShopUI(); // Open the temporary shop (in-game)
};

// Event Listener for Main Menu Shop (Permanent Upgrades)
document.getElementById('shopButton').onclick = () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('shop').style.display = 'block';
    createShopUI(); // Open the permanent shop (main menu)
};

// Game Speed Slider
document.getElementById('speedControl').oninput = function() {
    gameSpeed = parseFloat(this.value); // Update the game speed variable
    document.getElementById('speedValue').textContent = gameSpeed.toFixed(2); // Update the displayed speed
    updateGameSpeed(gameSpeed); // Call a function to apply the new game speed to your game logic
};

function updateGameSpeed(speed) {
    // Implement the logic here to update the game speed in your game
    console.log("Game speed updated to:", speed);
    setShootInterval();  // Update shooting interval based on new game speed
    // Any additional logic to adjust game mechanics for new speed
}
