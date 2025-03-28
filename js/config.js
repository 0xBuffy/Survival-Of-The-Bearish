// Game Configuration
const CONFIG = {
    // Canvas settings
    canvas: {
        width: 800,
        height: 600,
        backgroundColor: '#2E7D32'  // Forest green background
    },
    
    // Player settings
    player: {
        size: 30,
        speed: 0.1,  // Base speed matching hunter's wave 1 speed
        colors: {
            body: '#8B4513',    // Brown
            ears: '#8B4513',    // Brown
            eyes: '#000000',    // Black
            nose: '#000000'     // Black
        }
    },
    
    // Game settings
    game: {
        fps: 60,
        debug: false,
        startAnimation: {
            duration: 1000      // 1 second intro animation
        }
    },

    // Map settings
    map: {
        treeCount: 30,
        treeColors: {
            trunk: '#5D4037',   // Dark brown
            leaves: '#2E7D32'   // Forest green
        }
    }
};

window.CONFIG = CONFIG;
export { CONFIG }; 