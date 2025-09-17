
# Decentralized Fraud Detection System

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://python.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-000000.svg)](https://expressjs.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3+-f7931e.svg)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

This project implements a decentralized fraud detection system using **Federated Ensemble Learning (FEL)** and **Expert Rule System (ERS)**. The system consists of 3 client applications and 1 server application that work together to detect fraudulent transactions while preserving data privacy through federated learning principles.

## 🚀 Quick Start

```bash
# Install dependencies and start all services
node setup.js --install

# Or start with custom ports
node setup.js --install --python=6000 --server=4100 --client1=4101 --client2=4102 --client3=4103
```

## 🏗️ System Architecture

### Components:
- **3 Client Applications**: Each running on a separate port, simulating independent organizations
- **1 Server Application**: Aggregates predictions and applies fallback rules
- **Python ML Microservice**: Handles machine learning tasks (training, prediction, analysis)

### Communication Flow:
1. Clients train models on their local data
2. Clients share model metrics (not data) with the server
3. Server requests predictions from each client for new transactions
4. Server aggregates predictions and applies ERS when needed

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.7 or higher)
- **npm** or **yarn** package manager
- **Git** (for cloning the repository)

## ⚙️ Setup and Installation

### Automated Setup (Recommended)

The easiest way to get started is using our automated setup script:

```bash
# Install dependencies and start all services
node setup.js --install

# Start with custom ports
node setup.js --install --python=6000 --server=4100 --client1=4101 --client2=4102 --client3=4103

# Start services only (if dependencies are already installed)
node setup.js
```

### Manual Setup

If you prefer to set up each component manually:

#### 1. **Set up the Python ML Microservice:**
```bash
# Navigate to Python service directory
cd python-service

# Install dependencies
pip install -r requirements.txt

# If you encounter scikit-learn compatibility issues, run:
python ../fix-python-deps.py

# Start the service
python app.py
```

#### 2. **Set up the Server:**
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Build the React app
cd ..
npm run build
cp -r dist server/

# Start the server
cd server
npm start
```

#### 3. **Set up the Clients:**
For each client (1-3), repeat the following steps:

```bash
# Navigate to client directory
cd client-1 # (or client-2, client-3)

# Install dependencies
npm install

# Build the React app
cd ..
npm run build
cp -r dist client-1/

# Start the client
cd client-1
npm start
```

## 🚀 Running the System

After setting up all components, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **Server** | http://localhost:4000 | Main server dashboard and fraud detection |
| **Client 1** | http://localhost:4001 | First client organization |
| **Client 2** | http://localhost:4002 | Second client organization |
| **Client 3** | http://localhost:4003 | Third client organization |
| **Python ML Service** | http://localhost:5000 | Machine learning microservice |

## 📖 Usage Flow

### 1. **Training Models**:
   - On each client, navigate to the **Training** page
   - Upload a CSV dataset with transaction data
   - Train the machine learning model
   - Review training metrics and performance
   - Send model metrics to the server for aggregation

### 2. **Detecting Fraud**:
   - On the server, navigate to the **Detection** page
   - Enter individual transaction details or upload a CSV batch
   - View detection results from all participating clients
   - See Expert Rule System (ERS) results when triggered for edge cases

## 🔌 API Documentation

### Python ML Service (port 5000):
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/train-model` | POST | Train ML model using CSV data |
| `/get-metrics` | GET | Get training metrics for a model |
| `/predict` | POST | Make prediction on transaction data |
| `/ers` | POST | Apply expert rules system |
| `/analyze` | POST | Analyze dataset and provide insights |

### Client APIs (ports 4001, 4002, 4003):
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/client/:id/analyze` | POST | Analyze uploaded dataset |
| `/client/:id/train-model` | POST | Train model on uploaded dataset |
| `/client/:id/training-logs` | GET | Get training logs |
| `/client/:id/get-metrics` | GET | Get model metrics |
| `/client/:id/send-metrics` | POST | Send metrics to server |
| `/client/:id/status` | GET | Get client status |
| `/client/:id/predict` | POST | Make prediction on transaction |

### Server API (port 4000):
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/server/clients-status` | GET | Get status of all clients |
| `/server/detect` | POST | Detect fraud in single transaction |
| `/server/detect-batch` | POST | Detect fraud in multiple transactions |
| `/global/ers` | POST | Apply ERS rules for edge cases |

## 📊 Dataset Format

The system expects CSV files with at least the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `amount` | Number | Transaction amount |
| `type` | String | Transaction type (e.g., CASH_IN, CASH_OUT, TRANSFER) |
| `oldbalanceOrg` | Number | Initial balance of origin account |
| `newbalanceOrig` | Number | Final balance of origin account |
| `oldbalanceDest` | Number | Initial balance of destination account |
| `newbalanceDest` | Number | Final balance of destination account |
| `isFraud` | Binary | (Training data only) Label indicating fraudulent (1) or legitimate (0) transactions |

## 🛠️ Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Frontend** | React, TailwindCSS, Recharts | Latest |
| **Backend** | Node.js (Express) | 18+ |
| **ML Processing** | Python, scikit-learn | 3.7+, 1.3+ |
| **API Communication** | REST APIs | - |
| **Build Tool** | Vite | Latest |
| **Package Manager** | npm | Latest |

## 📁 Project Structure

```
implementation/
├── 📁 client-1/          # First client application
├── 📁 client-2/          # Second client application  
├── 📁 client-3/          # Third client application
├── 📁 server/            # Main server application
├── 📁 python-service/    # ML microservice
├── 📁 src/               # React frontend source
├── 📁 tests/             # Test scripts for settings validation
├── 📄 setup.js           # Automated setup script
├── 📄 fix-python-deps.py # Python dependency fixer
└── 📄 README.md          # This file
```

## 🔧 Troubleshooting

### Common Issues

1. **Python scikit-learn compatibility error:**
   ```bash
   python fix-python-deps.py
   ```

2. **Missing Node.js dependencies:**
   ```bash
   node setup.js --install
   ```

3. **Port already in use:**
   ```bash
   node setup.js --server=4100 --client1=4101 --client2=4102 --client3=4103
   ```

### Testing Settings Functionality

1. **Test server settings:**
   ```bash
   node tests/test-settings.js
   ```

2. **Test client settings:**
   ```bash
   node tests/test-client-settings.js
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies for robust fraud detection
- Implements federated learning principles for data privacy
- Uses ensemble methods for improved prediction accuracy
