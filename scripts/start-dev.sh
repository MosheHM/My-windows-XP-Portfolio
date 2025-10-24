#!/bin/bash

# Start the development environment with nginx gateway
set -e

echo "🚀 Starting Windows XP Portfolio - Development Environment"
echo "=========================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Change to project root
cd "$(dirname "$0")/.."

echo "📦 Building and starting services..."
echo ""

# Start services with docker compose
docker compose -f docker-compose.dev.yml up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for nginx gateway to be healthy
for i in {1..30}; do
    if curl -s http://localhost/health > /dev/null 2>&1; then
        echo "✅ Nginx gateway is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout waiting for nginx gateway"
        docker compose -f docker-compose.dev.yml logs nginx-gateway
        exit 1
    fi
    sleep 2
done

# Wait for services to be healthy
echo "⏳ Waiting for backend services..."
sleep 5

echo ""
echo "=========================================================="
echo "✅ Development environment is ready!"
echo "=========================================================="
echo ""
echo "Access the application:"
echo "  🌐 Client:     http://localhost/"
echo "  🤖 LLM API:    http://localhost/api/llm/"
echo "  📁 File API:   http://localhost/api/files/"
echo "  ❤️  Health:     http://localhost/health"
echo ""
echo "View logs:"
echo "  docker compose -f docker-compose.dev.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker compose -f docker-compose.dev.yml down"
echo ""
echo "Note: LLM service may take 2-3 minutes on first run to download the model"
echo ""
