
import axios from "axios";

// We'll be using different ports for our hypothetical services
// This would be configured with environment variables in a real app
const SERVER_BASE_URL = "http://localhost:4000"; // Server API
const CLIENT_BASE_URLS = {
  "1": "http://localhost:4001", // Client 1 API
  "2": "http://localhost:4002", // Client 2 API
  "3": "http://localhost:4003", // Client 3 API
};

// Python ML microservice URL
const PYTHON_ML_SERVICE_URL = "http://localhost:5000"; // Python ML service

// Types
export interface TrainingMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  dataVolume: number;
  fraudRatio: number;
  lastUpdated: string;
}

export interface TrainingLog {
  message: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "success";
}

export interface ClientStatus {
  clientId: string;
  modelStatus: "trained" | "training" | "not_trained" | "error";
  syncStatus: "synced" | "pending" | "error";
  metrics?: TrainingMetrics;
  lastSyncTime?: string;
}

export interface TransactionData {
  id?: string;
  amount: number;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  oldbalanceDest: number;
  newbalanceDest: number;
  type: string;
  isFraud?: boolean | number;
}

export interface PredictionResult {
  clientId: string;
  confidenceScore: number;
  prediction: "fraud" | "legitimate";
}

export interface ERSResult {
  triggered: boolean;
  matchedRules: string[];
  decision: "fraud" | "legitimate";
}

export interface AggregatedResult {
  transaction: TransactionData;
  clientPredictions: PredictionResult[];
  aggregatedScore: number;
  ersResult?: ERSResult;
  finalDecision: "fraud" | "legitimate";
}

export interface DataAnalysis {
  summary: {
    totalTransactions: number;
    fraudulentTransactions: number;
    fraudRatio: number;
    averageAmount: number;
    maxAmount: number;
  };
  insights: string[];
  chartData: {
    transactionsByType: { name: string; value: number }[];
    amountDistribution: { name: string; fraud: number; legitimate: number }[];
    fraudTimeSeries: { time: string; count: number }[];
  };
}

// Create API client instances for each service
const serverApiClient = axios.create({
  baseURL: SERVER_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

const getClientApiInstance = (clientId: string) => {
  return axios.create({
    baseURL: CLIENT_BASE_URLS[clientId as keyof typeof CLIENT_BASE_URLS],
    headers: { "Content-Type": "application/json" }
  });
};

const pythonMlApiClient = axios.create({
  baseURL: PYTHON_ML_SERVICE_URL,
  headers: { "Content-Type": "application/json" }
});

// API functions for clients
export const clientApi = {
  // Get client settings
  getClientSettings: async (clientId: string): Promise<any> => {
    const clientApiInstance = getClientApiInstance(clientId);
    const response = await clientApiInstance.get(`/client/${clientId}/settings`);
    return response.data;
  },

  // Save client settings
  saveClientSettings: async (clientId: string, settings: any): Promise<any> => {
    const clientApiInstance = getClientApiInstance(clientId);
    const response = await clientApiInstance.post(`/client/${clientId}/settings`, settings);
    return response.data;
  },

  // Data analysis
  analyzeData: async (clientId: string, data: FormData): Promise<DataAnalysis> => {
    const clientApiInstance = getClientApiInstance(clientId);
    // In a real implementation, the Node.js backend would forward this to the Python microservice
    // for ML-specific data analysis, then return the results
    const response = await clientApiInstance.post(`/client/${clientId}/analyze`, data);
    return response.data;
  },

  // Training
  trainModel: async (clientId: string, data: FormData): Promise<{ message: string }> => {
    const clientApiInstance = getClientApiInstance(clientId);
    // In a real implementation, the Node.js backend would:
    // 1. Receive the CSV data
    // 2. Send it to the Python microservice's /train-model endpoint
    // 3. Stream back training logs as they're generated
    // 4. Return completion message when done
    const response = await clientApiInstance.post(`/client/${clientId}/train-model`, data);
    return response.data;
  },

  // Get training logs
  getTrainingLogs: async (clientId: string): Promise<TrainingLog[]> => {
    const clientApiInstance = getClientApiInstance(clientId);
    // In a real implementation, these would be stored by the Node.js backend
    // during the training process
    const response = await clientApiInstance.get(`/client/${clientId}/training-logs`);
    return response.data;
  },

  // Get training metrics
  getMetrics: async (clientId: string): Promise<TrainingMetrics> => {
    const clientApiInstance = getClientApiInstance(clientId);
    // In a real implementation, the Node.js backend would request these
    // from the Python microservice's /get-metrics endpoint
    const response = await clientApiInstance.get(`/client/${clientId}/get-metrics`);
    return response.data;
  },

  // Send metrics to server
  sendMetricsToServer: async (clientId: string): Promise<{ success: boolean; message: string }> => {
    const clientApiInstance = getClientApiInstance(clientId);
    // In a real implementation, this would be a direct client-to-server communication
    const response = await clientApiInstance.post(`/client/${clientId}/send-metrics`);
    return response.data;
  },

  // Get client status
  getClientStatus: async (clientId: string): Promise<ClientStatus> => {
    const clientApiInstance = getClientApiInstance(clientId);
    const response = await clientApiInstance.get(`/client/${clientId}/status`);
    return response.data;
  },

  // Make a prediction on a single transaction
  predict: async (clientId: string, transaction: TransactionData): Promise<PredictionResult> => {
    const clientApiInstance = getClientApiInstance(clientId);
    // In a real implementation, the Node.js backend would forward this to
    // the Python microservice's /predict endpoint
    const response = await clientApiInstance.post(`/client/${clientId}/predict`, { transaction });
    return response.data;
  },
};

// API functions for server
export const serverApi = {
  // Get server settings
  getServerSettings: async (): Promise<any> => {
    const response = await serverApiClient.get(`/server/settings`);
    return response.data;
  },

  // Save server settings
  saveServerSettings: async (settings: any): Promise<any> => {
    const response = await serverApiClient.post(`/server/settings`, settings);
    return response.data;
  },

  // Get all clients status
  getAllClientsStatus: async (): Promise<ClientStatus[]> => {
    const response = await serverApiClient.get(`/server/clients-status`);
    return response.data;
  },

  // Detect fraud on a single transaction (aggregates from all clients)
  detectFraud: async (transaction: TransactionData): Promise<AggregatedResult> => {
    // In a real implementation, the server would:
    // 1. Send the transaction to each client's /predict endpoint
    // 2. Collect and aggregate the results
    // 3. Apply ERS if needed via the Python microservice
    const response = await serverApiClient.post(`/server/detect`, { transaction });
    return response.data;
  },

  // Batch detection (multiple transactions)
  detectBatch: async (transactions: TransactionData[]): Promise<AggregatedResult[]> => {
    const response = await serverApiClient.post(`/server/detect-batch`, { transactions });
    return response.data;
  },

  // Apply ERS rules for a transaction
  applyERS: async (transaction: TransactionData, score: number): Promise<ERSResult> => {
    // In a real implementation, this would forward to the Python microservice's /ers endpoint
    const response = await serverApiClient.post(`/global/ers`, { transaction, score });
    return response.data;
  },
};

// For simulation purposes (when no backend is available)
export const simulateApi = {
  // For demo or when backend is not available
  getRandomTrainingMetrics: (): TrainingMetrics => {
    return {
      accuracy: 0.85 + Math.random() * 0.1,
      precision: 0.75 + Math.random() * 0.15,
      recall: 0.8 + Math.random() * 0.15,
      f1Score: 0.78 + Math.random() * 0.12,
      auc: 0.82 + Math.random() * 0.13,
      dataVolume: Math.floor(10000 + Math.random() * 50000),
      fraudRatio: 0.001 + Math.random() * 0.01,
      lastUpdated: new Date().toISOString(),
    };
  },
  
  getRandomClientStatus: (clientId: string): ClientStatus => {
    const statuses: ("trained" | "training" | "not_trained" | "error")[] = ["trained", "training", "not_trained", "error"];
    const syncStatuses: ("synced" | "pending" | "error")[] = ["synced", "pending", "error"];
    
    const modelStatus = statuses[Math.floor(Math.random() * 4)];
    const syncStatus = syncStatuses[Math.floor(Math.random() * 3)];
    
    return {
      clientId,
      modelStatus,
      syncStatus,
      metrics: modelStatus === "trained" ? simulateApi.getRandomTrainingMetrics() : undefined,
      lastSyncTime: syncStatus === "synced" ? new Date().toISOString() : undefined,
    };
  },

  // Simulate Python API endpoints for documentation purposes
  pythonEndpoints: {
    trainModel: "/train-model",   // Receives CSV, returns training logs
    getMetrics: "/get-metrics",   // Returns model performance metrics
    predict: "/predict",          // Receives transaction data, returns prediction
    ers: "/ers",                  // Applies expert rules system
    analyze: "/analyze",          // Analyzes dataset
  }
};

