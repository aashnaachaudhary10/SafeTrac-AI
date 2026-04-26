#!/bin/bash
# SafeTrac AI — Quick Setup Script
# Run: bash setup.sh

echo ""
echo "🛡️  SafeTrac AI — Setup"
echo "   Team: Chai or Code ☕"
echo "================================"

# Backend setup
echo ""
echo "📦 Installing Python dependencies..."
cd backend
pip install -r requirements.txt --quiet
cd ..

# AI module setup
echo "📦 Installing AI module dependencies..."
cd ai_module
pip install SpeechRecognition requests --quiet
cd ..

# Frontend setup
echo "📦 Installing React dependencies..."
cd frontend
npm install --silent
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run the project:"
echo "  Terminal 1: cd backend && python app.py"
echo "  Terminal 2: cd ai_module && python voice_detector.py --demo"
echo "  Terminal 3: cd frontend && npm start"
echo ""
echo "Then open: http://localhost:3000"
