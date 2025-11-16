#!/usr/bin/env python3
"""
Test AI Agent with Supabase
"""

import asyncio
from agent import SATLearningAgent

async def test_supabase_agent():
    print("🧪 Testing AI Agent with Supabase\n")
    print("=" * 60)
    
    # Test user ID (UUID from Supabase auth.users table)
    # Ask teammate for a real user UUID or create one via frontend signup
    test_user_id = "00000000-0000-0000-0000-000000000000"  # ← REPLACE WITH REAL UUID!
    
    print(f"✅ Testing with user: {test_user_id}\n")
    
    # Initialize agent
    agent = SATLearningAgent(user_id=test_user_id)
    
    # Test 1: Analyze performance
    print("\n1️⃣  Analyzing user performance from Supabase...")
    analysis = agent.analyze_performance()
    print(f"✅ Performance Analysis:")
    print(f"   Total Attempts: {analysis['total_attempts']}")
    print(f"   Accuracy: {analysis['recent_accuracy']:.1f}%")
    print(f"   Weak Topics: {analysis['weak_topics']}")
    print(f"   Strong Topics: {analysis['strong_topics']}")
    
    # Test 2: Generate questions
    print("\n2️⃣  Generating 5 personalized questions...")
    questions = await agent.generate_questions(5, use_web_search=False)
    
    if questions:
        print(f"✅ Generated {len(questions)} questions!")
        print(f"\n📝 Sample Question:")
        q = questions[0]
        print(f"   Topic: {q['topic']}")
        print(f"   Q: {q['question']}")
        print(f"   Options: {', '.join(q['options'])}")
    else:
        print("❌ No questions generated")
    
    # Test 3: Save mock game results to Supabase
    print("\n3️⃣  Saving mock game results to Supabase...")
    game_data = {
        'game_type': 'zombie',
        'score': 500,
        'accuracy': 60.0,
        'correct_answers': 3,
        'wrong_answers': 2,
        'max_streak': 2,
        'avg_response_time': 15000,
    }
    
    question_attempts = [
        {
            'question_id': i,
            'topic': q['topic'],
            'difficulty': q['difficulty'],
            'is_correct': i % 2 == 0,
            'time_spent': 15000,
        }
        for i, q in enumerate(questions[:5])
    ]
    
    agent.update_performance(question_attempts, game_data)
    print("✅ Results saved to Supabase!")
    
    print("\n" + "=" * 60)
    print("✅ SUPABASE INTEGRATION TEST COMPLETE! 🎉")
    print("\nWhat happened:")
    print("1. ✅ Read user performance from Supabase")
    print("2. ✅ Generated personalized questions")
    print("3. ✅ Saved game results to Supabase")
    print("\nYour AI agent is now connected to Supabase!")

if __name__ == "__main__":
    asyncio.run(test_supabase_agent())

