
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// CORS middleware to allow cross-origin requests
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Configuration
const PORT = process.env.PORT || 4000; // Server port
const PYTHON_SERVICE_URL = 'http://localhost:5000'; // Python ML service
const CLIENT_APIS = {
  "1": "http://localhost:4001",
  "2": "http://localhost:4002",
  "3": "http://localhost:4003"
};

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Store clients' status and metrics
const clientsStatus = {
  "1": {
    modelStatus: "not_trained",
    syncStatus: "not_synced",
    metrics: null,
    lastSyncTime: null
  },
  "2": {
    modelStatus: "not_trained",
    syncStatus: "not_synced",
    metrics: null,
    lastSyncTime: null
  },
  "3": {
    modelStatus: "not_trained",
    syncStatus: "not_synced",
    metrics: null,
    lastSyncTime: null
  }
};

// Server settings with defaults
let serverSettings = {
  apiPort: 4000,
  ersThreshold: [0.45, 0.7],
  weightingStrategy: "performance", // "performance" or "equal"
  enableERS: true
};

// Load settings from file if it exists
const settingsFile = path.join(__dirname, 'server-settings.json');
try {
  if (fs.existsSync(settingsFile)) {
    const savedSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    serverSettings = { ...serverSettings, ...savedSettings };
    console.log('Server settings loaded from file');
  }
} catch (error) {
  console.error('Error loading server settings:', error);
}

// Function to save settings to file
const saveSettingsToFile = () => {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(serverSettings, null, 2));
    console.log('Server settings saved to file');
  } catch (error) {
    console.error('Error saving server settings:', error);
  }
};

// API Routes

// Get server settings
app.get('/server/settings', (req, res) => {
  res.json(serverSettings);
});

// Save server settings
app.post('/server/settings', (req, res) => {
  const { apiPort, ersThreshold, weightingStrategy, enableERS } = req.body;
  
  // Validate input
  if (apiPort && (isNaN(apiPort) || apiPort < 1 || apiPort > 65535)) {
    return res.status(400).json({ error: "Invalid API port number" });
  }
  
  if (ersThreshold && (!Array.isArray(ersThreshold) || ersThreshold.length !== 2)) {
    return res.status(400).json({ error: "ERS threshold must be an array of 2 numbers" });
  }
  
  if (weightingStrategy && !["performance", "equal"].includes(weightingStrategy)) {
    return res.status(400).json({ error: "Invalid weighting strategy" });
  }
  
  // Update settings
  if (apiPort !== undefined) serverSettings.apiPort = parseInt(apiPort);
  if (ersThreshold !== undefined) serverSettings.ersThreshold = ersThreshold;
  if (weightingStrategy !== undefined) serverSettings.weightingStrategy = weightingStrategy;
  if (enableERS !== undefined) serverSettings.enableERS = enableERS;
  
  // Save to file
  saveSettingsToFile();
  
  res.json({
    success: true,
    message: "Settings saved successfully",
    settings: serverSettings
  });
});

// Get all clients status
app.get('/server/clients-status', (req, res) => {
  // Convert object to array of status objects with clientId
  const statusArray = Object.keys(clientsStatus).map(clientId => ({
    clientId,
    ...clientsStatus[clientId]
  }));
  
  res.json(statusArray);
});

// Receive metrics from client
app.post('/server/receive-metrics', (req, res) => {
  const { clientId, metrics } = req.body;
  
  if (!clientId || !metrics) {
    return res.status(400).json({ error: "Missing clientId or metrics" });
  }
  
  if (!clientsStatus[clientId]) {
    return res.status(404).json({ error: "Invalid client ID" });
  }
  
  // Update client status
  clientsStatus[clientId].metrics = metrics;
  clientsStatus[clientId].syncStatus = "synced";
  clientsStatus[clientId].modelStatus = "trained";
  clientsStatus[clientId].lastSyncTime = new Date().toISOString();
  
  res.json({
    success: true,
    message: "Metrics received and stored successfully"
  });
});

// Detect fraud in a single transaction
app.post('/server/detect', async (req, res) => {
  const { transaction } = req.body;
  
  if (!transaction) {
    return res.status(400).json({ error: "Missing transaction data" });
  }
  
  try {
    // Collect predictions from all trained clients
    const clientPredictions = [];
    let aggregatedScore = 0;
    let trainedClientsCount = 0;
    
    const clientIds = Object.keys(clientsStatus);
    
    // Make requests to all clients with trained models
    for (const clientId of clientIds) {
      const clientStatus = clientsStatus[clientId];
      
      if (clientStatus.modelStatus === "trained") {
        try {
          // Request prediction from Python service directly (since this is a simulation)
          const response = await axios.post(`${PYTHON_SERVICE_URL}/predict`, {
            client_id: clientId,
            transaction
          });
          
          clientPredictions.push(response.data);
          aggregatedScore += response.data.confidenceScore;
          trainedClientsCount++;
        } catch (error) {
          console.error(`Error getting prediction from client ${clientId}:`, error.message);
          // Continue with other clients if one fails
        }
      }
    }
    
    // Calculate final aggregated score based on weighting strategy
    if (trainedClientsCount > 0) {
      if (serverSettings.weightingStrategy === "equal") {
        // Equal weights - simple average
        aggregatedScore = aggregatedScore / trainedClientsCount;
      } else {
        // Performance-based weights - weight by client metrics
        let totalWeight = 0;
        let weightedScore = 0;
        
        for (const prediction of clientPredictions) {
          const clientStatus = clientsStatus[prediction.clientId];
          if (clientStatus && clientStatus.metrics) {
            // Use F1 score as weight (you can modify this to use other metrics)
            const weight = clientStatus.metrics.f1Score || 0.5;
            weightedScore += prediction.confidenceScore * weight;
            totalWeight += weight;
          } else {
            // Fallback to equal weight if no metrics available
            weightedScore += prediction.confidenceScore;
            totalWeight += 1;
          }
        }
        
        aggregatedScore = totalWeight > 0 ? weightedScore / totalWeight : aggregatedScore / trainedClientsCount;
      }
    }
    
    // Apply ERS if score is in ambiguous range and ERS is enabled
    let ersResult = null;
    if (serverSettings.enableERS && 
        aggregatedScore >= serverSettings.ersThreshold[0] && 
        aggregatedScore <= serverSettings.ersThreshold[1]) {
      try {
        const ersResponse = await axios.post(`${PYTHON_SERVICE_URL}/ers`, {
          transaction,
          score: aggregatedScore
        });
        ersResult = ersResponse.data;
      } catch (error) {
        console.error("Error applying ERS:", error.message);
      }
    }
    
    // Determine final decision
    let finalDecision = "legitimate";
    if (aggregatedScore > 0.7) {
      finalDecision = "fraud";
    } else if (aggregatedScore >= 0.45 && ersResult) {
      finalDecision = ersResult.decision;
    }
    
    // Return the aggregated result
    res.json({
      transaction,
      clientPredictions,
      aggregatedScore,
      ersResult,
      finalDecision
    });
  } catch (error) {
    console.error("Error in fraud detection:", error.message);
    res.status(500).json({ error: "Failed to process detection request" });
  }
});

// Process batch of transactions
app.post('/server/detect-batch', upload.single('file'), async (req, res) => {
  try {
    // Check if file is provided
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read the CSV file
    const fileData = fs.readFileSync(req.file.path, 'utf8');
    const transactions = [];

    // Simple CSV parsing (in a real app, use a proper CSV parser)
    const lines = fileData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(',');
        const transaction = {};
        headers.forEach((header, index) => {
          transaction[header] = isNaN(values[index]) ? values[index] : parseFloat(values[index]);
        });
        transactions.push(transaction);
      }
    }

    // Process each transaction (limit to 10 for demo)
    const results = [];
    for (const transaction of transactions.slice(0, 10)) {
      try {
        // Reuse the single detection logic
        const clientPredictions = [];
        let aggregatedScore = 0;
        let trainedClientsCount = 0;
        
        const clientIds = Object.keys(clientsStatus);
        
        // Make requests to all clients with trained models
        for (const clientId of clientIds) {
          const clientStatus = clientsStatus[clientId];
          
          if (clientStatus.modelStatus === "trained") {
            try {
              const response = await axios.post(`${PYTHON_SERVICE_URL}/predict`, {
                client_id: clientId,
                transaction
              });
              
              clientPredictions.push(response.data);
              aggregatedScore += response.data.confidenceScore;
              trainedClientsCount++;
            } catch (error) {
              // Continue with other clients if one fails
            }
          }
        }
        
        // Calculate final aggregated score based on weighting strategy
        if (trainedClientsCount > 0) {
          if (serverSettings.weightingStrategy === "equal") {
            // Equal weights - simple average
            aggregatedScore = aggregatedScore / trainedClientsCount;
          } else {
            // Performance-based weights - weight by client metrics
            let totalWeight = 0;
            let weightedScore = 0;
            
            for (const prediction of clientPredictions) {
              const clientStatus = clientsStatus[prediction.clientId];
              if (clientStatus && clientStatus.metrics) {
                // Use F1 score as weight (you can modify this to use other metrics)
                const weight = clientStatus.metrics.f1Score || 0.5;
                weightedScore += prediction.confidenceScore * weight;
                totalWeight += weight;
              } else {
                // Fallback to equal weight if no metrics available
                weightedScore += prediction.confidenceScore;
                totalWeight += 1;
              }
            }
            
            aggregatedScore = totalWeight > 0 ? weightedScore / totalWeight : aggregatedScore / trainedClientsCount;
          }
        }
        
        // Apply ERS if score is in ambiguous range and ERS is enabled
        let ersResult = null;
        if (serverSettings.enableERS && 
            aggregatedScore >= serverSettings.ersThreshold[0] && 
            aggregatedScore <= serverSettings.ersThreshold[1]) {
          try {
            const ersResponse = await axios.post(`${PYTHON_SERVICE_URL}/ers`, {
              transaction,
              score: aggregatedScore
            });
            ersResult = ersResponse.data;
          } catch (error) {
            // Continue without ERS if it fails
          }
        }
        
        // Determine final decision
        let finalDecision = "legitimate";
        if (aggregatedScore > 0.7) {
          finalDecision = "fraud";
        } else if (aggregatedScore >= 0.45 && ersResult) {
          finalDecision = ersResult.decision;
        }
        
        // Add to results
        results.push({
          transaction,
          clientPredictions,
          aggregatedScore,
          ersResult,
          finalDecision
        });
      } catch (error) {
        // Skip failed transactions
        console.error("Error processing transaction:", error);
      }
    }

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);
    
    res.json(results);
  } catch (error) {
    console.error("Error in batch detection:", error);
    res.status(500).json({ error: "Failed to process batch detection request" });
  }
});

// Apply ERS rules for edge cases
app.post('/global/ers', async (req, res) => {
  const { transaction, score } = req.body;
  
  if (!transaction) {
    return res.status(400).json({ error: "Missing transaction data" });
  }
  
  try {
    // Call the Python service to apply ERS rules
    const response = await axios.post(`${PYTHON_SERVICE_URL}/ers`, {
      transaction,
      score: score || 0.5
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Error applying ERS rules:", error.message);
    res.status(500).json({ error: "Failed to apply ERS rules" });
  }
});

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server API running on port ${PORT}`);
});
