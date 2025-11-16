#!/usr/bin/env python3
"""Quick test - just replace the UUID and run!"""

import asyncio
from agent import SATLearningAgent

async def quick_test():
    # ⬇️ PASTE YOUR SUPABASE USER UUID HERE ⬇️
    user_id = "00000000-0000-0000-0000-000000000000"
    
    print(f"🧪 Testing agent for user: {user_id}\n")
    
    agent = SATLearningAgent(user_id=user_id)
    
    # Analyze performance
    print("📊 Analyzing performance...")
    analysis = agent.analyze_performance()
    print(f"✅ Total attempts: {analysis['total_attempts']}")
    print(f"✅ Accuracy: {analysis['recent_accuracy']:.1f}%")
    print(f"✅ Weak topics: {analysis['weak_topics']}")
    
    # Generate questions
    print("\n🤖 Generating 3 questions...")
    questions = await agent.generate_questions(3, use_web_search=False)
    
    if questions:
        print(f"✅ Generated {len(questions)} questions!")
        print(f"\n📝 First question:")
        print(f"   Topic: {questions[0]['topic']}")
        print(f"   Q: {questions[0]['question']}")
    else:
        print("❌ Failed to generate questions")
    
    print("\n✅ DONE! Agent is working!")

if __name__ == "__main__":
    asyncio.run(quick_test())

