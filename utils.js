// utils.js

// utils.js

// Update towerStats to include poison-related stats
const towerStats = {
    attack: 10,
    attackSpeed: 1.2,
    defense: 3,
    critChance: 0,
    critMultiplier: 1.2,
    lifesteal: 0.25,
    radius: 3,
    poisonChance: 0,  // Default chance is 0
    poisonRadius: 1,  // Default radius is 1
    poisonDamage: 1, // Default damage is 1
};

let tempTowerStats = { ...towerStats };  // Create a temporary copy for in-game upgrades

function resetTempTowerStats() {
    tempTowerStats = { ...towerStats };  // Reset temporary stats to permanent stats
}

let towerHP = 100, maxTowerHP = 100;
let commonResource = 5, rareResource = 0;

let upgradeCosts = {
    attack: 1,
    attackSpeed: 1,
    defense: 1,
    critChance: 1,
    radius: 1,
    // Poison upgrade costs
    poisonChance: 1,
    poisonRadius: 1,
    poisonDamage: 1
};

let upgradeScaling = {
    attack: 0.125,
    attackSpeed: 0.125,
    defense: 0.125,
    critChance: 0.125,
    critMultiplier: 0.125,
    lifesteal: 0.125,
    radius: 0.125,
    // Poison upgrades scaling
    poisonChance: 0.125,
    poisonRadius: 0.125,
    poisonDamage: 0.125
};

function scaleUpgradeCost(stat) {
    return Math.ceil(upgradeCosts[stat] * upgradeScaling[stat]);
}

