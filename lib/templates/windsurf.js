/**
 * Windsurf rule templates
 * These templates provide the actual implementation code for each windsurf rule type
 */

// Basic windsurf movement rule template
const basic = `  // Basic windsurf movement
  function setupBasicMovement(simulation) {
    // Initialize basic windsurf properties
    simulation.position = { x: 0, y: 0 };
    simulation.velocity = { x: 0, y: 0 };
    simulation.rotation = 0;
    simulation.sailAngle = 0;
    
    // Movement controls
    simulation.controls = {
      moveForward: false,
      moveBackward: false,
      turnLeft: false,
      turnRight: false,
      adjustSail: 0 // -1 to 1 range
    };
    
    // Main update function for movement
    simulation.updateMovement = function(deltaTime) {
      // Update rotation based on turning controls
      if (simulation.controls.turnLeft) {
        simulation.rotation -= 1 * deltaTime;
      }
      if (simulation.controls.turnRight) {
        simulation.rotation += 1 * deltaTime;
      }
      
      // Calculate forward direction vector
      const directionX = Math.sin(simulation.rotation);
      const directionY = Math.cos(simulation.rotation);
      
      // Apply acceleration based on controls
      const acceleration = 0.1;
      if (simulation.controls.moveForward) {
        simulation.velocity.x += directionX * acceleration * deltaTime;
        simulation.velocity.y += directionY * acceleration * deltaTime;
      }
      if (simulation.controls.moveBackward) {
        simulation.velocity.x -= directionX * acceleration * deltaTime;
        simulation.velocity.y -= directionY * acceleration * deltaTime;
      }
      
      // Apply drag/friction
      const drag = 0.98;
      simulation.velocity.x *= drag;
      simulation.velocity.y *= drag;
      
      // Update position
      simulation.position.x += simulation.velocity.x;
      simulation.position.y += simulation.velocity.y;
      
      // Adjust sail
      simulation.sailAngle = Math.max(-Math.PI/2, Math.min(Math.PI/2, 
                             simulation.sailAngle + simulation.controls.adjustSail * 0.05));
      
      // Return current state
      return {
        position: simulation.position,
        rotation: simulation.rotation,
        sailAngle: simulation.sailAngle
      };
    };
    
    // Set up keyboard controls
    const keydownHandler = (e) => {
      switch(e.key) {
        case 'w': case 'ArrowUp':
          simulation.controls.moveForward = true;
          break;
        case 's': case 'ArrowDown':
          simulation.controls.moveBackward = true;
          break;
        case 'a': case 'ArrowLeft':
          simulation.controls.turnLeft = true;
          break;
        case 'd': case 'ArrowRight':
          simulation.controls.turnRight = true;
          break;
        case 'q':
          simulation.controls.adjustSail = -1;
          break;
        case 'e':
          simulation.controls.adjustSail = 1;
          break;
      }
    };
    
    const keyupHandler = (e) => {
      switch(e.key) {
        case 'w': case 'ArrowUp':
          simulation.controls.moveForward = false;
          break;
        case 's': case 'ArrowDown':
          simulation.controls.moveBackward = false;
          break;
        case 'a': case 'ArrowLeft':
          simulation.controls.turnLeft = false;
          break;
        case 'd': case 'ArrowRight':
          simulation.controls.turnRight = false;
          break;
        case 'q': case 'e':
          simulation.controls.adjustSail = 0;
          break;
      }
    };
    
    // Add event listeners
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    
    // Clean up function
    simulation.cleanup = function() {
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('keyup', keyupHandler);
    };
  }
  
  // Start and stop simulation functions
  function startSimulation(simulation) {
    if (simulation.animationFrame) return;
    
    let lastTime = 0;
    const update = (time) => {
      const deltaTime = (lastTime) ? (time - lastTime) / 16 : 1;
      lastTime = time;
      
      simulation.updateMovement(deltaTime);
      
      // Call other update functions
      if (simulation.updatePhysics) simulation.updatePhysics(deltaTime);
      if (simulation.updateWaves) simulation.updateWaves(deltaTime);
      if (simulation.updateWind) simulation.updateWind(deltaTime);
      if (simulation.updateSail) simulation.updateSail(deltaTime);
      
      simulation.animationFrame = requestAnimationFrame(update);
    };
    
    simulation.animationFrame = requestAnimationFrame(update);
  }
  
  function stopSimulation(simulation) {
    if (simulation.animationFrame) {
      cancelAnimationFrame(simulation.animationFrame);
      simulation.animationFrame = null;
    }
    
    if (simulation.cleanup) {
      simulation.cleanup();
    }
  }`;

// Advanced physics rule template
const physics = `  // Advanced physics for windsurf simulation
  function setupAdvancedPhysics(simulation) {
    // Physics constants
    simulation.physics = {
      gravity: 9.81,
      mass: 80, // kg (rider + board)
      boardWidth: 0.6, // meters
      boardLength: 2.5, // meters
      waterDensity: 1000, // kg/m³
      airDensity: 1.225, // kg/m³
      dragCoefficient: 0.4,
      liftCoefficient: 1.2,
      frictionCoefficient: 0.1
    };
    
    // Extended state for physics
    simulation.state = {
      speed: 0,
      acceleration: 0,
      forces: {
        wind: { x: 0, y: 0 },
        resistance: { x: 0, y: 0 },
        sailLift: { x: 0, y: 0 },
        boardLift: { x: 0, y: 0 },
        gravity: { x: 0, y: 0 },
        total: { x: 0, y: 0 }
      }
    };
    
    // Calculate cross-sectional area of the board
    const boardArea = simulation.physics.boardWidth * simulation.physics.boardLength;
    
    // Physics update function
    simulation.updatePhysics = function(deltaTime) {
      // Calculate wind force on sail
      const sailArea = 5.0; // m²
      const windSpeed = simulation.config.windSpeed;
      const windAngle = Math.PI / 4; // 45 degrees by default
      const sailEfficiency = Math.sin(simulation.sailAngle - windAngle + Math.PI);
      
      const windPressure = 0.5 * simulation.physics.airDensity * windSpeed * windSpeed;
      const windForce = windPressure * sailArea * sailEfficiency;
      
      // Break down wind force into components
      const windDirectionX = Math.sin(windAngle);
      const windDirectionY = Math.cos(windAngle);
      
      simulation.state.forces.wind.x = windForce * windDirectionX;
      simulation.state.forces.wind.y = windForce * windDirectionY;
      
      // Calculate water resistance
      const speed = Math.sqrt(
        simulation.velocity.x * simulation.velocity.x + 
        simulation.velocity.y * simulation.velocity.y
      );
      
      const resistanceForce = 0.5 * simulation.physics.waterDensity * 
                            speed * speed * 
                            simulation.physics.dragCoefficient * 
                            boardArea;
      
      // Resistance acts opposite to velocity
      if (speed > 0) {
        simulation.state.forces.resistance.x = -resistanceForce * simulation.velocity.x / speed;
        simulation.state.forces.resistance.y = -resistanceForce * simulation.velocity.y / speed;
      } else {
        simulation.state.forces.resistance.x = 0;
        simulation.state.forces.resistance.y = 0;
      }
      
      // Calculate sail lift
      const apparentWindX = windDirectionX * windSpeed - simulation.velocity.x;
      const apparentWindY = windDirectionY * windSpeed - simulation.velocity.y;
      const apparentWindSpeed = Math.sqrt(apparentWindX * apparentWindX + apparentWindY * apparentWindY);
      
      const apparentWindAngle = Math.atan2(apparentWindX, apparentWindY);
      const sailAngleToWind = simulation.sailAngle - apparentWindAngle;
      
      const liftForce = 0.5 * simulation.physics.airDensity * 
                      apparentWindSpeed * apparentWindSpeed * 
                      sailArea * 
                      simulation.physics.liftCoefficient * 
                      Math.sin(2 * sailAngleToWind);
      
      // Lift is perpendicular to apparent wind
      const liftAngle = apparentWindAngle + Math.PI / 2;
      simulation.state.forces.sailLift.x = liftForce * Math.sin(liftAngle);
      simulation.state.forces.sailLift.y = liftForce * Math.cos(liftAngle);
      
      // Calculate total force
      simulation.state.forces.total.x = simulation.state.forces.wind.x + 
                                      simulation.state.forces.resistance.x + 
                                      simulation.state.forces.sailLift.x;
                                      
      simulation.state.forces.total.y = simulation.state.forces.wind.y + 
                                      simulation.state.forces.resistance.y + 
                                      simulation.state.forces.sailLift.y;
      
      // Calculate acceleration (F = ma)
      const accelerationX = simulation.state.forces.total.x / simulation.physics.mass;
      const accelerationY = simulation.state.forces.total.y / simulation.physics.mass;
      
      // Update velocity
      simulation.velocity.x += accelerationX * deltaTime;
      simulation.velocity.y += accelerationY * deltaTime;
      
      // Update speed
      simulation.state.speed = Math.sqrt(
        simulation.velocity.x * simulation.velocity.x + 
        simulation.velocity.y * simulation.velocity.y
      );
      
      // Update acceleration
      simulation.state.acceleration = Math.sqrt(
        accelerationX * accelerationX + 
        accelerationY * accelerationY
      );
      
      return {
        forces: simulation.state.forces,
        speed: simulation.state.speed,
        acceleration: simulation.state.acceleration
      };
    };
  }`;

// Wave interaction rule template
const wave = `  // Wave interaction for windsurf simulation
  function setupWaveInteraction(simulation) {
    // Wave parameters
    simulation.waves = {
      sets: [
        { amplitude: 0.5, frequency: 0.1, phase: 0, direction: 0 },
        { amplitude: 0.3, frequency: 0.2, phase: Math.PI / 4, direction: Math.PI / 6 },
        { amplitude: 0.2, frequency: 0.15, phase: Math.PI / 2, direction: -Math.PI / 8 }
      ],
      time: 0,
      enabled: true,
      currentHeight: 0
    };
    
    // Configure wave parameters based on simulation config
    const updateWaveParameters = () => {
      const waveHeight = simulation.config.waveHeight || 1.5;
      
      // Adjust primary wave amplitude based on config
      simulation.waves.sets[0].amplitude = waveHeight * 0.5;
      
      // Adjust secondary waves proportionally
      simulation.waves.sets[1].amplitude = waveHeight * 0.3;
      simulation.waves.sets[2].amplitude = waveHeight * 0.2;
    };
    
    // Call initially to set up waves
    updateWaveParameters();
    
    // Wave update function
    simulation.updateWaves = function(deltaTime) {
      // Update wave time
      simulation.waves.time += deltaTime * 0.01;
      
      // Update wave parameters if config changes
      if (simulation.config.waveHeight !== undefined) {
        updateWaveParameters();
      }
      
      // Calculate current wave height at board position
      let totalHeight = 0;
      const pos = simulation.position;
      
      for (const wave of simulation.waves.sets) {
        // Calculate dot product of position and wave direction
        const dirX = Math.sin(wave.direction);
        const dirY = Math.cos(wave.direction);
        const dot = pos.x * dirX + pos.y * dirY;
        
        // Calculate wave height at this position and time
        const argument = wave.frequency * dot + simulation.waves.time + wave.phase;
        const height = wave.amplitude * Math.sin(argument);
        
        totalHeight += height;
      }
      
      simulation.waves.currentHeight = totalHeight;
      
      // Apply wave effects to board movement
      if (simulation.waves.enabled) {
        // Get wave slope at current position (approximate derivative)
        const slopeX = 0;
        const slopeY = 0;
        
        for (const wave of simulation.waves.sets) {
          const dirX = Math.sin(wave.direction);
          const dirY = Math.cos(wave.direction);
          const dot = pos.x * dirX + pos.y * dirY;
          
          const argument = wave.frequency * dot + simulation.waves.time + wave.phase;
          const derivative = wave.amplitude * wave.frequency * Math.cos(argument);
          
          slopeX += derivative * dirX;
          slopeY += derivative * dirY;
        }
        
        // Apply wave force based on the slope
        const waveForceMultiplier = 0.05;
        
        // Add to velocity based on wave slope
        simulation.velocity.x += slopeX * waveForceMultiplier * deltaTime;
        simulation.velocity.y += slopeY * waveForceMultiplier * deltaTime;
        
        // Adjust rotation based on wave slope
        const rotationImpact = 0.02;
        const rotationForce = (slopeX * Math.cos(simulation.rotation) - 
                              slopeY * Math.sin(simulation.rotation)) * 
                              rotationImpact;
        
        simulation.rotation += rotationForce * deltaTime;
      }
      
      return {
        waveHeight: simulation.waves.currentHeight,
        slopeX: slopeX,
        slopeY: slopeY
      };
    };
    
    // Function to toggle waves
    simulation.toggleWaves = function() {
      simulation.waves.enabled = !simulation.waves.enabled;
      return simulation.waves.enabled;
    };
  }`;

// Wind dynamics rule template
const wind = `  // Wind dynamics for windsurf simulation
  function setupWindDynamics(simulation) {
    // Wind parameters
    simulation.wind = {
      baseSpeed: simulation.config.windSpeed || 15,
      currentSpeed: simulation.config.windSpeed || 15,
      baseDirection: 0, // radians
      currentDirection: 0,
      gusting: false,
      gustProbability: 0.005, // Probability of a gust starting each frame
      gustDuration: { min: 100, max: 300 }, // Frames
      gustIntensity: { min: 1.2, max: 1.8 }, // Multiplier
      currentGust: {
        active: false,
        remaining: 0,
        intensity: 1,
        targetDirection: 0
      },
      turbulence: 0.02, // Random variation in wind
      time: 0
    };
    
    // Update wind parameters from config
    const updateWindParameters = () => {
      if (simulation.config.windSpeed !== undefined) {
        simulation.wind.baseSpeed = simulation.config.windSpeed;
      }
      
      // Adjust gust probability based on wind speed
      simulation.wind.gustProbability = 0.001 + (simulation.wind.baseSpeed / 50) * 0.01;
    };
    
    // Call initially
    updateWindParameters();
    
    // Wind update function
    simulation.updateWind = function(deltaTime) {
      // Update time
      simulation.wind.time += deltaTime;
      
      // Check if config has changed
      updateWindParameters();
      
      // Process current gust if active
      if (simulation.wind.currentGust.active) {
        simulation.wind.currentGust.remaining -= deltaTime;
        
        if (simulation.wind.currentGust.remaining <= 0) {
          // End the gust
          simulation.wind.currentGust.active = false;
          simulation.wind.gusting = false;
        } else {
          // Continue the gust
          simulation.wind.gusting = true;
          
          // Smooth direction change during gust
          const directionDiff = simulation.wind.currentGust.targetDirection - simulation.wind.currentDirection;
          simulation.wind.currentDirection += directionDiff * 0.01 * deltaTime;
        }
      } else {
        // Check if a new gust should start
        if (Math.random() < simulation.wind.gustProbability * deltaTime) {
          // Start a new gust
          const gustDuration = simulation.wind.gustDuration.min + 
                              Math.random() * (simulation.wind.gustDuration.max - simulation.wind.gustDuration.min);
                              
          const gustIntensity = simulation.wind.gustIntensity.min + 
                               Math.random() * (simulation.wind.gustIntensity.max - simulation.wind.gustIntensity.min);
          
          // Random direction change for the gust
          const directionChange = (Math.random() - 0.5) * Math.PI / 4; // ±45 degrees
          
          simulation.wind.currentGust.active = true;
          simulation.wind.currentGust.remaining = gustDuration;
          simulation.wind.currentGust.intensity = gustIntensity;
          simulation.wind.currentGust.targetDirection = simulation.wind.baseDirection + directionChange;
          
          simulation.wind.gusting = true;
        }
      }
      
      // Calculate current wind speed with turbulence
      let currentSpeed = simulation.wind.baseSpeed;
      
      // Add gust effect
      if (simulation.wind.gusting) {
        currentSpeed *= simulation.wind.currentGust.intensity;
      }
      
      // Add subtle turbulence using perlin-like noise approximation
      const turbulenceX = Math.sin(simulation.wind.time * 0.3) * Math.cos(simulation.wind.time * 0.7);
      const turbulenceY = Math.sin(simulation.wind.time * 0.5) * Math.cos(simulation.wind.time * 0.4);
      const turbulence = (turbulenceX + turbulenceY) * 0.5;
      
      currentSpeed += turbulence * simulation.wind.turbulence * currentSpeed;
      
      // Update current speed
      simulation.wind.currentSpeed = currentSpeed;
      
      // Calculate wind vector
      const windX = Math.sin(simulation.wind.currentDirection) * simulation.wind.currentSpeed;
      const windY = Math.cos(simulation.wind.currentDirection) * simulation.wind.currentSpeed;
      
      // Return current wind state
      return {
        speed: simulation.wind.currentSpeed,
        direction: simulation.wind.currentDirection,
        vector: { x: windX, y: windY },
        gusting: simulation.wind.gusting
      };
    };
    
    // Function to manually set wind direction
    simulation.setWindDirection = function(direction) {
      simulation.wind.baseDirection = direction;
      return simulation.wind.baseDirection;
    };
    
    // Function to manually set wind speed
    simulation.setWindSpeed = function(speed) {
      simulation.wind.baseSpeed = speed;
      simulation.config.windSpeed = speed;
      return simulation.wind.baseSpeed;
    };
  }`;

// Sail controls rule template
const sail = `  // Sail controls for windsurf simulation
  function setupSailControls(simulation) {
    // Sail parameters
    simulation.sail = {
      angle: 0, // Angle relative to board
      targetAngle: 0,
      sheetTension: 0.5, // 0 to 1, how tight the sail is sheeted in
      optimumAngle: 0, // Calculated optimal angle to wind
      power: 0, // Current sail power (0 to 1)
      area: 5.0, // m²
      aspectRatio: 2.5, // Height/width ratio
      boomPosition: 0.4, // Position of boom from bottom (0 to 1)
      mastBend: 0, // Mast bend under load (0 to 1)
      isUpsideDown: false // Flag for when sailor has flipped the sail
    };
    
    // Override basic sail angle
    simulation.sailAngle = 0;
    
    // Add sail controls to simulation controls
    simulation.controls.sheetIn = false;  // Pull sail in
    simulation.controls.sheetOut = false; // Let sail out
    simulation.controls.flip = false;     // Flip sail to other side
    
    // Keyboard handler for sail controls
    const keydownHandler = (e) => {
      switch(e.key) {
        case 'q':
          simulation.controls.sheetIn = true;
          break;
        case 'e':
          simulation.controls.sheetOut = true;
          break;
        case 'r':
          simulation.controls.flip = true;
          break;
      }
    };
    
    const keyupHandler = (e) => {
      switch(e.key) {
        case 'q':
          simulation.controls.sheetIn = false;
          break;
        case 'e':
          simulation.controls.sheetOut = false;
          break;
        case 'r':
          simulation.controls.flip = false;
          break;
      }
    };
    
    // Add event listeners
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    
    // Store existing cleanup function
    const existingCleanup = simulation.cleanup || function() {};
    
    // Override cleanup to remove our event listeners
    simulation.cleanup = function() {
      // Call existing cleanup
      existingCleanup();
      
      // Remove our event listeners
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('keyup', keyupHandler);
    };
    
    // Sail update function
    simulation.updateSail = function(deltaTime) {
      // Get current wind data
      const windDirection = simulation.wind ? simulation.wind.currentDirection : 0;
      const windSpeed = simulation.wind ? simulation.wind.currentSpeed : simulation.config.windSpeed;
      
      // Get board heading
      const boardHeading = simulation.rotation;
      
      // Calculate relative wind angle to board
      const relativeWindAngle = windDirection - boardHeading;
      
      // Update sheet tension based on controls
      if (simulation.controls.sheetIn) {
        simulation.sail.sheetTension = Math.min(1, simulation.sail.sheetTension + 0.01 * deltaTime);
      }
      if (simulation.controls.sheetOut) {
        simulation.sail.sheetTension = Math.max(0, simulation.sail.sheetTension - 0.01 * deltaTime);
      }
      
      // Calculate maximum sail angle based on sheet tension
      // When fully sheeted in (tension = 1), max angle is small
      // When fully sheeted out (tension = 0), max angle is large
      const maxSailAngle = (1 - simulation.sail.sheetTension) * Math.PI * 0.8;
      
      // Calculate optimal sail angle for current wind direction
      // For maximum power, sail should be at ~45° to the apparent wind
      // Calculate apparent wind (wind relative to the moving board)
      const apparentWindX = Math.sin(windDirection) * windSpeed - simulation.velocity.x;
      const apparentWindY = Math.cos(windDirection) * windSpeed - simulation.velocity.y;
      const apparentWindAngle = Math.atan2(apparentWindX, apparentWindY) - boardHeading;
      
      // Optimal angle is ~45° to the apparent wind
      const optimalSailAngle = apparentWindAngle - Math.sign(apparentWindAngle) * Math.PI / 4;
      
      // Clamp to max angle based on sheet tension
      simulation.sail.optimumAngle = Math.max(-maxSailAngle, Math.min(maxSailAngle, optimalSailAngle));
      
      // Check for sail flip
      if (simulation.controls.flip && !simulation.sail.isFlipping) {
        simulation.sail.isFlipping = true;
        simulation.sail.targetAngle = -simulation.sail.angle;
        simulation.sail.flipTimer = 50; // Frames to complete flip
      }
      
      // Process sail flip animation
      if (simulation.sail.isFlipping) {
        simulation.sail.flipTimer -= deltaTime;
        
        if (simulation.sail.flipTimer <= 0) {
          simulation.sail.isFlipping = false;
        } else {
          // Move sail toward target angle quickly during flip
          const flipProgress = 1 - (simulation.sail.flipTimer / 50);
          simulation.sail.angle = simulation.sail.angle * (1 - flipProgress) + 
                               simulation.sail.targetAngle * flipProgress;
        }
      } else {
        // Normal sail angle behavior (not flipping)
        // Move sail toward optimum angle based on wind pressure and sheet tension
        const sailInertia = 0.05; // How quickly sail responds
        simulation.sail.targetAngle = simulation.sail.optimumAngle;
        
        // Limit by maximum sheet angle
        simulation.sail.targetAngle = Math.max(-maxSailAngle, Math.min(maxSailAngle, simulation.sail.targetAngle));
        
        // Gradually move sail toward target angle
        simulation.sail.angle += (simulation.sail.targetAngle - simulation.sail.angle) * sailInertia * deltaTime;
      }
      
      // Calculate sail power based on angle to apparent wind
      const sailToWindAngle = Math.abs(apparentWindAngle - simulation.sail.angle);
      const optimalAngle = Math.PI / 4; // 45 degrees
      
      // Power peaks at optimal angle and drops off in either direction
      simulation.sail.power = Math.cos((sailToWindAngle - optimalAngle) * 1.5);
      simulation.sail.power = Math.max(0, simulation.sail.power);
      
      // Calculate mast bend based on wind pressure and sail power
      const apparentWindSpeed = Math.sqrt(apparentWindX * apparentWindX + apparentWindY * apparentWindY);
      simulation.sail.mastBend = (apparentWindSpeed / 20) * simulation.sail.power * 0.3;
      
      // Store the new sail angle for other systems to use
      simulation.sailAngle = simulation.sail.angle;
      
      // Return current sail state
      return {
        angle: simulation.sail.angle,
        power: simulation.sail.power,
        sheetTension: simulation.sail.sheetTension,
        mastBend: simulation.sail.mastBend,
        optimumAngle: simulation.sail.optimumAngle
      };
    };
  }`;

module.exports = {
  basic,
  physics,
  wave,
  wind,
  sail
};
