const { spawn } = require('child_process');
const path = require('path');

// Start the server
const startServer = () => {
  console.log('Starting server...');
  
  const server = spawn('node', ['backend/server.js'], {
    stdio: 'inherit',
    shell: true
  });

  server.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  server.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Server exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Stopping server...');
    server.kill('SIGINT');
    process.exit(0);
  });
};

startServer(); 