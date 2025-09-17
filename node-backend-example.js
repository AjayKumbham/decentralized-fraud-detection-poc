
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// CORS middleware to allow cross-origin requests
app.use(cors());
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 4001; // Different port for each client
const CLIENT_ID = process.env.CLIENT_ID || "1"; // Client ID
const PYTHON_SERVICE_URL = 'http://localhost:5000'; // Python ML service

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

// API Routes

// Analyze data
app.post('/client/:clientId/analyze', upload.single('file'), async (req, res) => {
  try {
    // Verify client ID
    const { clientId } = req.params;
    if (clientId !== CLIENT_ID) {
      return res.status(403).json({ error: "Unauthorized client ID" });
    }

    // Create form data to send to Python service
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    
    // Send request to Python service
    const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze`, formData, {
      headers: { ...formData.getHeaders() }
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

    // Update model status
    modelStatus = "training";
    trainingLogs = []; // Reset logs

    // Create form data to send to Python service
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    formData.append('client_id', clientId);
    
    // Send request to Python service
    const response = await axios.post(`${PYTHON_SERVICE_URL}/train-model`, formData, {
      headers: { ...formData.getHeaders() }
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
    res.json({ message: response.data.message });
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
    // In a real app, this would send to the actual server API
    const serverUrl = 'http://localhost:4000';
    await axios.post(`${serverUrl}/server/receive-metrics`, {
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

// Start server
app.listen(PORT, () => {
  console.log(`Client ${CLIENT_ID} API running on port ${PORT}`);
});
