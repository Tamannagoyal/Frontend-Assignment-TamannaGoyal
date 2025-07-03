import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, controls, skybox;
let planet_sun, planet_mercury, planet_venus, planet_earth, planet_mars, 
    planet_jupiter, planet_saturn, planet_uranus, planet_neptune;

// Animation control
let isAnimating = true;
let lastTime = 0;
let pausedTime = 0;
let timeOffset = 0;

// Orbital radii
const mercury_orbit_radius = 50;
const venus_orbit_radius = 60;
const earth_orbit_radius = 70;
const mars_orbit_radius = 80;
const jupiter_orbit_radius = 100;
const saturn_orbit_radius = 120;
const uranus_orbit_radius = 140;
const neptune_orbit_radius = 160;

// Planet speeds (adjustable via UI)
let planetSpeeds = {
    mercury: 2,
    venus: 1.5,
    earth: 1,
    mars: 0.8,
    jupiter: 0.7,
    saturn: 0.6,
    uranus: 0.5,
    neptune: 0.4
};

function createMaterialArray() {
    const skyboxImagepaths = [
        '../img/skybox/space_ft.png', 
        '../img/skybox/space_bk.png', 
        '../img/skybox/space_up.png', 
        '../img/skybox/space_dn.png', 
        '../img/skybox/space_rt.png', 
        '../img/skybox/space_lf.png'
    ];
    const materialArray = skyboxImagepaths.map((image) => {
        let texture = new THREE.TextureLoader().load(image);
        return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
    });
    return materialArray;
}

function setSkyBox() {
    const materialArray = createMaterialArray();
    let skyboxGeo = new THREE.BoxGeometry(1000, 1000, 1000);
    skybox = new THREE.Mesh(skyboxGeo, materialArray);
    scene.add(skybox);
}

function loadPlanetTexture(texture, radius, widthSegments, heightSegments, meshType) {
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const loader = new THREE.TextureLoader();
    const planetTexture = loader.load(texture);
    const material = meshType == 'standard' 
        ? new THREE.MeshStandardMaterial({ map: planetTexture }) 
        : new THREE.MeshBasicMaterial({ map: planetTexture });

    return new THREE.Mesh(geometry, material);
}

function createRing(innerRadius) {
    let outerRadius = innerRadius - 0.1;
    let thetaSegments = 100;
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments);
    const material = new THREE.MeshBasicMaterial({ 
        color: '#ffffff', 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
}

function setupUI() {
    // Speed controls
    const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
    
    planets.forEach(planet => {
        const slider = document.getElementById(`${planet}-speed`);
        const valueDisplay = document.getElementById(`${planet}-value`);
        
        slider.value = planetSpeeds[planet];
        valueDisplay.textContent = planetSpeeds[planet];
        
        slider.addEventListener('input', (e) => {
            planetSpeeds[planet] = parseFloat(e.target.value);
            valueDisplay.textContent = e.target.value;
        });
    });

    // Pause/resume button
    const pauseButton = document.getElementById('pause-btn');
    pauseButton.addEventListener('click', toggleAnimation);
    updatePauseButton();
}

function toggleAnimation() {
    isAnimating = !isAnimating;
    
    if (!isAnimating) {
        pausedTime = performance.now();
    } else {
        // When resuming, adjust the time offset to account for paused time
        const currentTime = performance.now();
        timeOffset += currentTime - pausedTime;
    }
    
    updatePauseButton();
}

function updatePauseButton() {
    const pauseButton = document.getElementById('pause-btn');
    pauseButton.textContent = isAnimating ? '⏸ Pause' : '▶ Resume';
}

function planetRevolver(time, planet, orbitRadius, planetName) {
    let orbitSpeedMultiplier = 0.001;
    const planetAngle = time * orbitSpeedMultiplier * planetSpeeds[planetName];
    planet.position.x = planet_sun.position.x + orbitRadius * Math.cos(planetAngle);
    planet.position.z = planet_sun.position.z + orbitRadius * Math.sin(planetAngle);
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        85,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    setSkyBox();
    
    // Create planets
    planet_earth = loadPlanetTexture("../img/earth_hd.jpg", 4, 100, 100, 'standard');
    planet_sun = loadPlanetTexture("../img/sun_hd.jpg", 20, 100, 100, 'basic');
    planet_mercury = loadPlanetTexture("../img/mercury_hd.jpg", 2, 100, 100, 'standard');
    planet_venus = loadPlanetTexture("../img/venus_hd.jpg", 3, 100, 100, 'standard');
    planet_mars = loadPlanetTexture("../img/mars_hd.jpg", 3.5, 100, 100, 'standard');
    planet_jupiter = loadPlanetTexture("../img/jupiter_hd.jpg", 10, 100, 100, 'standard');
    planet_saturn = loadPlanetTexture("../img/saturn_hd.jpg", 8, 100, 100, 'standard');
    planet_uranus = loadPlanetTexture("../img/uranus_hd.jpg", 6, 100, 100, 'standard');
    planet_neptune = loadPlanetTexture("../img/neptune_hd.jpg", 5, 100, 100, 'standard');

    // Add planets to scene
    scene.add(planet_earth);
    scene.add(planet_sun);
    scene.add(planet_mercury);
    scene.add(planet_venus);
    scene.add(planet_mars);
    scene.add(planet_jupiter);
    scene.add(planet_saturn);
    scene.add(planet_uranus);
    scene.add(planet_neptune);

    // Add sun light
    const sunLight = new THREE.PointLight(0xffffff, 1, 0);
    sunLight.position.copy(planet_sun.position);
    scene.add(sunLight);

    // Create orbital rings
    createRing(mercury_orbit_radius);
    createRing(venus_orbit_radius);
    createRing(earth_orbit_radius);
    createRing(mars_orbit_radius);
    createRing(jupiter_orbit_radius);
    createRing(saturn_orbit_radius);
    createRing(uranus_orbit_radius);
    createRing(neptune_orbit_radius);

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.id = "c";
    
    // Set up controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 12;
    controls.maxDistance = 1000;
    camera.position.z = 100;

    // Set up UI
    setupUI();
}

function animate(currentTime) {
    requestAnimationFrame(animate);

    // Calculate adjusted time based on pause state
    let adjustedTime;
    if (isAnimating) {
        adjustedTime = currentTime - timeOffset;
        lastTime = adjustedTime;
    } else {
        adjustedTime = lastTime;
    }

    // Rotate planets on their axes
    const rotationSpeed = 0.005;
    planet_earth.rotation.y += isAnimating ? rotationSpeed : 0;
    planet_sun.rotation.y += isAnimating ? rotationSpeed : 0;
    planet_mercury.rotation.y += isAnimating ? rotationSpeed : 0;
    planet_venus.rotation.y += isAnimating ? rotationSpeed : 0;
    planet_mars.rotation.y += isAnimating ? rotationSpeed : 0;
    planet_jupiter.rotation.y += isAnimating ? rotationSpeed : 0;
    planet_saturn.rotation.y += isAnimating ? rotationSpeed : 0;
    planet_uranus.rotation.y += isAnimating ? rotationSpeed : 0;
    planet_neptune.rotation.y += isAnimating ? rotationSpeed : 0;

    // Revolve planets around the sun
    planetRevolver(adjustedTime, planet_mercury, mercury_orbit_radius, 'mercury');
    planetRevolver(adjustedTime, planet_venus, venus_orbit_radius, 'venus');
    planetRevolver(adjustedTime, planet_earth, earth_orbit_radius, 'earth');
    planetRevolver(adjustedTime, planet_mars, mars_orbit_radius, 'mars');
    planetRevolver(adjustedTime, planet_jupiter, jupiter_orbit_radius, 'jupiter');
    planetRevolver(adjustedTime, planet_saturn, saturn_orbit_radius, 'saturn');
    planetRevolver(adjustedTime, planet_uranus, uranus_orbit_radius, 'uranus');
    planetRevolver(adjustedTime, planet_neptune, neptune_orbit_radius, 'neptune');

    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize, false);

init();
animate(0);