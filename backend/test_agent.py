"""
Quick test to verify the AI Agent is working
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.services.agent import SATLearningAgent
from src.config import OPENROUTER_API_KEY

async def test_agent():
    print("=" * 60)
    print("🧪 Testing AI Learning Agent")
    print("=" * 60)
    
    # Check API key
    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY not found in .env!")
        return
    
    print(f"✅ OpenRouter API Key found: {OPENROUTER_API_KEY[:20]}...")
    
    # Test with a dummy user ID
    test_user_id = "00000000-0000-0000-0000-000000000000"
    print(f"\n📝 Creating agent for test user: {test_user_id}")
    
    agent = SATLearningAgent(test_user_id)
    
    # Analyze performance (should work even with no data)
    print("\n📊 Analyzing performance...")
    analysis = agent.analyze_performance()
    print(f"   Total attempts: {analysis['total_attempts']}")
    print(f"   Accuracy: {analysis['recent_accuracy']:.1f}%")
    print(f"   Weak topics: {analysis['weak_topics']}")
    print(f"   Recommended difficulty: {analysis['recommended_difficulty']}")
    
    # Generate questions (without web search to avoid rate limits)
    print("\n🤖 Generating 5 personalized questions with Claude Haiku 4.5...")
    questions = await agent.generate_questions(num_questions=5, use_web_search=False)
    
    if questions:
        print(f"\n✅ Generated {len(questions)} questions!")
        print("\nSample question:")
        print(f"   Q: {questions[0]['question']}")
        print(f"   Options: {questions[0]['options']}")
        print(f"   Answer: {questions[0]['options'][questions[0]['correctAnswer']]}")
        print(f"   Topic: {questions[0]['topic']}")
        print(f"   Difficulty: {questions[0]['difficulty']}")
    else:
        print("❌ No questions generated!")
    
    print("\n" + "=" * 60)
    print("✅ AI Agent is working!" if questions else "❌ AI Agent failed!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_agent())

