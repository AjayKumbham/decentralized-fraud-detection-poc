
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const upload = multer({ dest: 'uploads/' });

// CORS middleware to allow cross-origin requests
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Configuration
const PORT = process.env.PORT || 4001; // Client 1 port
const CLIENT_ID = process.env.CLIENT_ID || "1"; // Client ID
const PYTHON_SERVICE_URL = 'http://localhost:5000'; // Python ML service
const SERVER_URL = 'http://localhost:4000'; // Server API

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Store training logs and metrics in memory
// In a real app, these would be stored in a database
let trainingLogs = [];
let modelMetrics = null;
let modelStatus = "not_trained"; // "trained", "training", "not_trained", "error"
let syncStatus = "not_synced"; // "synced", "pending", "error"
let lastSyncTime = null;

// Client settings with defaults
let clientSettings = {
  clientName: `Client ${CLIENT_ID}`,
  apiPort: PORT,
  modelType: "random_forest",
  dataRetention: 30,
  autoSync: true,
  enableLogging: true,
  maxTrainingTime: 300, // 5 minutes
  confidenceThreshold: 0.5
};

// Load settings from file if it exists
const settingsFile = path.join(__dirname, 'client-settings.json');
try {
  if (fs.existsSync(settingsFile)) {
    const savedSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    clientSettings = { ...clientSettings, ...savedSettings };
    console.log('Client settings loaded from file');
  }
} catch (error) {
  console.error('Error loading client settings:', error);
}

// Function to save settings to file
const saveSettingsToFile = () => {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(clientSettings, null, 2));
    console.log('Client settings saved to file');
  } catch (error) {
    console.error('Error saving client settings:', error);
  }
};

// API Routes

// Get client settings
app.get('/client/:clientId/settings', (req, res) => {
  const { clientId } = req.params;
  if (clientId !== CLIENT_ID) {
    return res.status(403).json({ error: "Unauthorized client ID" });
  }
  res.json(clientSettings);
});

// Save client settings
app.post('/client/:clientId/settings', (req, res) => {
  const { clientId } = req.params;
  if (clientId !== CLIENT_ID) {
    return res.status(403).json({ error: "Unauthorized client ID" });
  }
  
  const { clientName, apiPort, modelType, dataRetention, autoSync, enableLogging, maxTrainingTime, confidenceThreshold } = req.body;
  
  // Validate input
  if (apiPort && (isNaN(apiPort) || apiPort < 1 || apiPort > 65535)) {
    return res.status(400).json({ error: "Invalid API port number" });
  }
  
  if (dataRetention && (isNaN(dataRetention) || dataRetention < 1 || dataRetention > 365)) {
    return res.status(400).json({ error: "Data retention must be between 1 and 365 days" });
  }
  
  if (maxTrainingTime && (isNaN(maxTrainingTime) || maxTrainingTime < 60 || maxTrainingTime > 3600)) {
    return res.status(400).json({ error: "Max training time must be between 60 and 3600 seconds" });
  }
  
  if (confidenceThreshold && (isNaN(confidenceThreshold) || confidenceThreshold < 0 || confidenceThreshold > 1)) {
    return res.status(400).json({ error: "Confidence threshold must be between 0 and 1" });
  }
  
  // Update settings
  if (clientName !== undefined) clientSettings.clientName = clientName;
  if (apiPort !== undefined) clientSettings.apiPort = parseInt(apiPort);
  if (modelType !== undefined) clientSettings.modelType = modelType;
  if (dataRetention !== undefined) clientSettings.dataRetention = parseInt(dataRetention);
  if (autoSync !== undefined) clientSettings.autoSync = autoSync;
  if (enableLogging !== undefined) clientSettings.enableLogging = enableLogging;
  if (maxTrainingTime !== undefined) clientSettings.maxTrainingTime = parseInt(maxTrainingTime);
  if (confidenceThreshold !== undefined) clientSettings.confidenceThreshold = parseFloat(confidenceThreshold);
  
  // Save to file
  saveSettingsToFile();
  
  res.json({
    success: true,
    message: "Settings saved successfully",
    settings: clientSettings
  });
});

// Analyze data
app.post('/client/:clientId/analyze', upload.single('file'), async (req, res) => {
  try {
    // Verify client ID
    const { clientId } = req.params;
    if (clientId !== CLIENT_ID) {
      return res.status(403).json({ error: "Unauthorized client ID" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Create form data to send to Python service
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    
    // Send request to Python service
    const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze`, formData, {
      headers: formData.getHeaders()
    });
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    // Return results from Python service
    res.json(response.data);
  } catch (error) {
    console.error('Error analyzing data:', error);
    res.status(500).json({ error: 'Failed to analyze data' });
  }
});

// Train model
app.post('/client/:clientId/train-model', upload.single('file'), async (req, res) => {
  try {
    // Verify client ID
    const { clientId } = req.params;
    if (clientId !== CLIENT_ID) {
      return res.status(403).json({ error: "Unauthorized client ID" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Update model status
    modelStatus = "training";
    trainingLogs = []; // Reset logs

    // Create form data to send to Python service
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    formData.append('client_id', clientId);
    
    // Send request to Python service
    const response = await axios.post(`${PYTHON_SERVICE_URL}/train-model`, formData, {
      headers: formData.getHeaders()
    });
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    // Store training logs
    trainingLogs = response.data.logs;
    
    // Update model status
    modelStatus = "trained";
    
    // Fetch metrics
    const metricsResponse = await axios.get(`${PYTHON_SERVICE_URL}/get-metrics?client_id=${clientId}`);
    modelMetrics = metricsResponse.data;
    
    // Return success message
    res.json({ message: response.data.message, logs: trainingLogs });
  } catch (error) {
    console.error('Error training model:', error);
    modelStatus = "error";
    res.status(500).json({ error: 'Failed to train model' });
  }
});

// Get training logs
app.get('/client/:clientId/training-logs', (req, res) => {
  // Verify client ID
  const { clientId } = req.params;
  if (clientId !== CLIENT_ID) {
    return res.status(403).json({ error: "Unauthorized client ID" });
  }
  
  res.json(trainingLogs);
});

// Get metrics
app.get('/client/:clientId/get-metrics', (req, res) => {
  // Verify client ID
  const { clientId } = req.params;
  if (clientId !== CLIENT_ID) {
    return res.status(403).json({ error: "Unauthorized client ID" });
  }
  
  if (!modelMetrics) {
    return res.status(404).json({ error: "No metrics available" });
  }
  
  res.json(modelMetrics);
});

// Send metrics to server
app.post('/client/:clientId/send-metrics', async (req, res) => {
  try {
    // Verify client ID
    const { clientId } = req.params;
    if (clientId !== CLIENT_ID) {
      return res.status(403).json({ error: "Unauthorized client ID" });
    }
    
    if (!modelMetrics) {
      return res.status(404).json({ error: "No metrics available to send" });
    }
    
    // Update sync status
    syncStatus = "pending";
    
    // Send metrics to server
    await axios.post(`${SERVER_URL}/server/receive-metrics`, {
      clientId,
      metrics: modelMetrics
    });
    
    // Update sync status and time
    syncStatus = "synced";
    lastSyncTime = new Date().toISOString();
    
    res.json({
      success: true,
      message: "Metrics sent to server successfully"
    });
  } catch (error) {
    console.error('Error sending metrics:', error);
    syncStatus = "error";
    res.status(500).json({ error: 'Failed to send metrics to server' });
  }
});

// Get client status
app.get('/client/:clientId/status', (req, res) => {
  // Verify client ID
  const { clientId } = req.params;
  if (clientId !== CLIENT_ID) {
    return res.status(403).json({ error: "Unauthorized client ID" });
  }
  
  res.json({
    clientId,
    modelStatus,
    syncStatus,
    metrics: modelMetrics,
    lastSyncTime
  });
});

// Make prediction
app.post('/client/:clientId/predict', async (req, res) => {
  try {
    // Verify client ID
    const { clientId } = req.params;
    if (clientId !== CLIENT_ID) {
      return res.status(403).json({ error: "Unauthorized client ID" });
    }
    
    if (modelStatus !== "trained") {
      return res.status(400).json({ error: "Model not trained" });
    }
    
    const { transaction } = req.body;
    
    if (!transaction) {
      return res.status(400).json({ error: "Missing transaction data" });
    }
    
    // Send request to Python service
    const response = await axios.post(`${PYTHON_SERVICE_URL}/predict`, {
      client_id: clientId,
      transaction
    });
    
    // Return prediction
    res.json(response.data);
  } catch (error) {
    console.error('Error making prediction:', error);
    res.status(500).json({ error: 'Failed to make prediction' });
  }
});

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Client ${CLIENT_ID} API running on port ${PORT}`);
});
