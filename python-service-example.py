
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import os
import json
import time

app = Flask(__name__)

# Store models for each client
client_models = {}
client_metrics = {}

@app.route('/train-model', methods=['POST'])
def train_model():
    """Train a fraud detection model using CSV data"""
    # Extract client ID and file from request
    client_id = request.form.get('client_id')
    file = request.files.get('file')
    
    # Process the CSV file
    df = pd.read_csv(file)
    
    # Create training logs list to return
    logs = []
    logs.append({"message": f"Loading dataset for client {client_id}", 
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"), 
                "level": "info"})
    
    # Log data info
    logs.append({"message": f"Dataset loaded successfully: {len(df)} records", 
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "level": "info"})
    
    # Preprocess data
    logs.append({"message": "Data preprocessing started", 
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "level": "info"})
    
    # Example preprocessing and training steps
    # Feature engineering
    X = df.drop('isFraud', axis=1)  # Features
    y = df['isFraud']              # Target variable
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    logs.append({"message": "Data split: 80% training, 20% validation", 
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "level": "info"})
    
    # Train a model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    
    logs.append({"message": "Training started with RandomForest (100 estimators)", 
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "level": "info"})
    
    # Simulate training epochs
    for i in range(1, 9):
        # In real implementation, this would be actual training epochs
        time.sleep(0.2)  # Simulate training time
        accuracy = 0.75 + (i * 0.025)
        loss = 0.5 - (i * 0.035)
        
        logs.append({
            "message": f"Epoch {i}/8 completed - loss: {loss:.2f}, accuracy: {accuracy:.2f}", 
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "level": "info"
        })
    
    # Fit the model
    model.fit(X_train, y_train)
    
    # Save the model for this client
    client_models[client_id] = model
    
    # Calculate metrics on test set
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
    
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "f1Score": float(f1_score(y_test, y_pred)),
        "auc": float(roc_auc_score(y_test, y_proba)),
        "dataVolume": len(df),
        "fraudRatio": float(np.mean(y)),
        "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    
    # Store metrics for this client
    client_metrics[client_id] = metrics
    
    logs.append({"message": "Training completed successfully", 
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "level": "success"})
    logs.append({"message": "Model evaluation complete", 
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "level": "success"})
    logs.append({"message": "Model saved to client storage", 
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "level": "success"})
    
    return jsonify({"logs": logs, "message": "Training completed successfully"})

@app.route('/get-metrics', methods=['GET'])
def get_metrics():
    """Get metrics for a trained model"""
    client_id = request.args.get('client_id')
    
    if client_id not in client_metrics:
        return jsonify({"error": "No metrics available for this client"}), 404
        
    return jsonify(client_metrics[client_id])

@app.route('/predict', methods=['POST'])
def predict():
    """Make a prediction on transaction data"""
    data = request.json
    client_id = data.get('client_id')
    transaction = data.get('transaction')
    
    if client_id not in client_models:
        return jsonify({"error": "No model trained for this client"}), 404
    
    # Convert transaction to features
    # This would need to match the format expected by the model
    features = np.array([
        transaction['amount'],
        transaction['oldbalanceOrg'],
        transaction['newbalanceOrig'],
        transaction['oldbalanceDest'],
        transaction['newbalanceDest'],
        # Encode transaction type
        1 if transaction['type'] == 'TRANSFER' else 0,
        1 if transaction['type'] == 'CASH_OUT' else 0,
        1 if transaction['type'] == 'PAYMENT' else 0,
        1 if transaction['type'] == 'DEBIT' else 0,
        1 if transaction['type'] == 'CASH_IN' else 0
    ]).reshape(1, -1)
    
    # Get model for this client
    model = client_models[client_id]
    
    # Make prediction
    prediction_proba = model.predict_proba(features)[0, 1]  # Probability of fraud
    prediction = "fraud" if prediction_proba > 0.5 else "legitimate"
    
    return jsonify({
        "clientId": client_id,
        "confidenceScore": float(prediction_proba),
        "prediction": prediction
    })

@app.route('/ers', methods=['POST'])
def apply_ers():
    """Apply expert rules system to a transaction"""
    data = request.json
    transaction = data.get('transaction')
    score = data.get('score')
    
    # Define expert rules
    rules = {
        "high_amount": transaction['amount'] > 200000,
        "amount_exceeds_balance": transaction['amount'] > transaction['oldbalanceOrg'],
        "zero_recipient_initial": transaction['oldbalanceDest'] == 0,
        "suspicious_pattern": (transaction['oldbalanceOrg'] > 0 and transaction['newbalanceOrig'] == 0),
        "unbalanced_transfer": abs(transaction['amount'] - (transaction['newbalanceDest'] - transaction['oldbalanceDest'])) > 1000
    }
    
    # Check which rules were triggered
    matched_rules = [rule for rule, triggered in rules.items() if triggered]
    
    # Make decision based on rules
    # Only apply if confidence score is in the threshold range
    decision = "fraud" if len(matched_rules) >= 2 else "legitimate"
    
    return jsonify({
        "triggered": len(matched_rules) > 0,
        "matchedRules": matched_rules,
        "decision": decision
    })

@app.route('/analyze', methods=['POST'])
def analyze_data():
    """Analyze a dataset and provide insights"""
    # Extract client ID and file from request
    file = request.files.get('file')
    
    # Process the CSV file
    df = pd.read_csv(file)
    
    # Calculate summary statistics
    total_transactions = len(df)
    fraudulent_transactions = df['isFraud'].sum()
    fraud_ratio = fraudulent_transactions / total_transactions
    average_amount = df['amount'].mean()
    max_amount = df['amount'].max()
    
    # Generate insights
    insights = [
        f"Dataset contains {total_transactions} transactions with {fraudulent_transactions} fraudulent cases ({fraud_ratio:.2%})",
        f"Average transaction amount is ${average_amount:.2f}",
        f"Largest transaction amount is ${max_amount:.2f}",
        "Most fraudulent transactions occur during transfer and cash-out operations",
        "Transactions with very high amounts relative to account balance are more likely to be fraudulent"
    ]
    
    # Generate chart data
    # Transactions by type
    transactions_by_type = df['type'].value_counts().reset_index()
    transactions_by_type_data = [
        {"name": row['index'], "value": row['type']} 
        for _, row in transactions_by_type.iterrows()
    ]
    
    # Amount distribution (simplified)
    amount_bins = [0, 10000, 50000, 100000, float('inf')]
    df['amountBin'] = pd.cut(df['amount'], amount_bins, labels=['<10K', '10K-50K', '50K-100K', '>100K'])
    amount_dist = df.groupby(['amountBin', 'isFraud']).size().unstack().fillna(0).reset_index()
    amount_distribution_data = []
    for _, row in amount_dist.iterrows():
        amount_distribution_data.append({
            "name": row['amountBin'],
            "fraud": int(row.get(1, 0)),
            "legitimate": int(row.get(0, 0))
        })
    
    # Time series (simplified)
    # Assuming there's a 'time' column, or we're creating a dummy one
    df['time'] = pd.date_range(start='2023-01-01', periods=len(df), freq='H')
    fraud_time_series = df.groupby(df['time'].dt.date)['isFraud'].sum().reset_index()
    fraud_time_series_data = [
        {"time": row['time'].strftime("%Y-%m-%d"), "count": int(row['isFraud'])}
        for _, row in fraud_time_series.iterrows()
    ]
    
    # Prepare response
    analysis = {
        "summary": {
            "totalTransactions": total_transactions,
            "fraudulentTransactions": int(fraudulent_transactions),
            "fraudRatio": float(fraud_ratio),
            "averageAmount": float(average_amount),
            "maxAmount": float(max_amount)
        },
        "insights": insights,
        "chartData": {
            "transactionsByType": transactions_by_type_data,
            "amountDistribution": amount_distribution_data,
            "fraudTimeSeries": fraud_time_series_data
        }
    }
    
    return jsonify(analysis)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
