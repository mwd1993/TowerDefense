// scene.js

// Declare global variables for scene elements
let scene, camera, renderer, tower, radiusCircle;

function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Add a directional light
    let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Optionally, add ambient light for softer lighting
    let ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create the tower (center square)
    let geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    tower = new THREE.Mesh(geometry, material);
    scene.add(tower);

    // Create the radius circle now that tower is initialized
    createRadiusCircle(towerStats.radius);

    // Show relevant UI
    document.getElementById('hpBarContainer').style.display = 'block';
    document.getElementById('waveContainer').style.display = 'block';
    document.getElementById('statsContainer').style.display = 'block';
    document.getElementById('resourceContainer').style.display = 'block';
    document.getElementById('endRunButton').style.display = 'block';
}

function createRadiusCircle(radius) {
    if (!tower) {
        console.error("Tower is not initialized, cannot create radius circle.");
        return;
    }
    let radiusGeometry = new THREE.CircleGeometry(radius, 64);
    let radiusMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true });
    radiusCircle = new THREE.Mesh(radiusGeometry, radiusMaterial);
    radiusCircle.position.set(tower.position.x, tower.position.y, tower.position.z - 0.1);
    scene.add(radiusCircle);
}

function renderScene() {
    if (renderer) {
        renderer.render(scene, camera);
    }
}

function clearScene() {
    while (scene.children.length > 0) {
        const object = scene.children[0];
        scene.remove(object);

        // Clean up object's geometry and material
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
    }
}

