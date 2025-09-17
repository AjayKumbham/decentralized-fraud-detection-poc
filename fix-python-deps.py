#!/usr/bin/env python3
"""
Script to fix scikit-learn/numpy compatibility issues
"""
import subprocess
import sys

def run_command(command):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {command}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {command}")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("Fixing Python dependencies...")
    
    # Uninstall problematic packages
    packages_to_remove = ['scikit-learn', 'numpy', 'scipy']
    for package in packages_to_remove:
        run_command(f"pip uninstall -y {package}")
    
    # Install numpy first
    if not run_command("pip install numpy==1.24.3"):
        print("Failed to install numpy")
        return False
    
    # Install scipy
    if not run_command("pip install scipy==1.10.1"):
        print("Failed to install scipy")
        return False
    
    # Install scikit-learn
    if not run_command("pip install scikit-learn==1.3.0"):
        print("Failed to install scikit-learn")
        return False
    
    # Install other requirements
    if not run_command("pip install -r python-service/requirements.txt"):
        print("Failed to install other requirements")
        return False
    
    print("Python dependencies fixed successfully!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 