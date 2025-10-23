#!/bin/bash

# Local Development Helper Script
# Starts all services for local development

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}Windows XP Portfolio - Local Dev${NC}"
echo -e "${GREEN}===================================${NC}"
echo

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Python
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "Error: Python is not installed"
    exit 1
fi
PYTHON_CMD=$(command -v python3 || command -v python)
echo "✓ Python found: $PYTHON_CMD"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi
echo "✓ npm found: $(npm --version)"

echo

# Setup virtual environments for Python services
echo -e "${YELLOW}Setting up Python services...${NC}"

# LLM Service
if [ ! -d "services/llm-service/venv" ]; then
    echo "Creating virtual environment for LLM service..."
    cd services/llm-service
    $PYTHON_CMD -m venv venv
    source venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    deactivate
    cd ../..
    echo "✓ LLM service environment created"
else
    echo "✓ LLM service environment exists"
fi

# File Service
if [ ! -d "services/file-service/venv" ]; then
    echo "Creating virtual environment for file service..."
    cd services/file-service
    $PYTHON_CMD -m venv venv
    source venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    deactivate
    cd ../..
    echo "✓ File service environment created"
else
    echo "✓ File service environment exists"
fi

echo

# Setup client
echo -e "${YELLOW}Setting up client...${NC}"
if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client
    npm install
    cd ..
    echo "✓ Client dependencies installed"
else
    echo "✓ Client dependencies exist"
fi

# Create .env.local if it doesn't exist
if [ ! -f "client/.env.local" ]; then
    echo "Creating .env.local for client..."
    cp client/.env.example client/.env.local
    echo "✓ .env.local created"
fi

echo

# Start services
echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}Starting Services${NC}"
echo -e "${GREEN}===================================${NC}"
echo

echo "Services will start in separate terminal windows/tabs"
echo "Press Ctrl+C in each terminal to stop the services"
echo

# Detect OS to use appropriate terminal commands
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Starting LLM service..."
    osascript -e 'tell app "Terminal" to do script "cd '"$PWD"'/services/llm-service && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"'
    
    sleep 2
    echo "Starting file service..."
    osascript -e 'tell app "Terminal" to do script "cd '"$PWD"'/services/file-service && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8001"'
    
    sleep 2
    echo "Starting client..."
    osascript -e 'tell app "Terminal" to do script "cd '"$PWD"'/client && npm run dev"'
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v gnome-terminal &> /dev/null; then
        echo "Starting LLM service..."
        gnome-terminal -- bash -c "cd $PWD/services/llm-service && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000; exec bash"
        
        sleep 2
        echo "Starting file service..."
        gnome-terminal -- bash -c "cd $PWD/services/file-service && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8001; exec bash"
        
        sleep 2
        echo "Starting client..."
        gnome-terminal -- bash -c "cd $PWD/client && npm run dev; exec bash"
    else
        echo "Please start services manually in separate terminals:"
        echo ""
        echo "Terminal 1 - LLM Service:"
        echo "  cd services/llm-service && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
        echo ""
        echo "Terminal 2 - File Service:"
        echo "  cd services/file-service && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8001"
        echo ""
        echo "Terminal 3 - Client:"
        echo "  cd client && npm run dev"
    fi
else
    echo "Unsupported OS. Please start services manually:"
    echo ""
    echo "Terminal 1 - LLM Service:"
    echo "  cd services/llm-service && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    echo "Terminal 2 - File Service:"
    echo "  cd services/file-service && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8001"
    echo ""
    echo "Terminal 3 - Client:"
    echo "  cd client && npm run dev"
fi

echo
echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}Services Information${NC}"
echo -e "${GREEN}===================================${NC}"
echo
echo "LLM Service:  http://localhost:8000"
echo "  API Docs:   http://localhost:8000/docs"
echo
echo "File Service: http://localhost:8001"
echo "  API Docs:   http://localhost:8001/docs"
echo
echo "Client:       http://localhost:5173"
echo
echo -e "${GREEN}✓ Development environment ready!${NC}"
