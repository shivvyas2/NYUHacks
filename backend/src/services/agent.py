from openai import OpenAI
from typing import List, Dict
import json
import time
from src.config import OPENROUTER_API_KEY
from duckduckgo_search import DDGS
from src.services.supabase_agent_ops import SupabaseAgentOps

# Use OpenRouter (compatible with OpenAI API)
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
)

# Initialize DuckDuckGo search with retry capability
def get_ddg_instance():
    """Get a fresh DuckDuckGo instance"""
    return DDGS(timeout=20)

class SATLearningAgent:
    """
    Adaptive SAT Learning Agent with Memory & Context
    - Analyzes user performance from Supabase
    - Identifies weak topics
    - Generates personalized questions with Claude Haiku 4.5
    - Maintains context of learning journey
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.context_memory = []
        print(f"🔗 Agent initialized for user {user_id}")
        
    def analyze_performance(self) -> Dict:
        """Analyzes user's historical performance from Supabase"""
        
        performance = SupabaseAgentOps.get_user_performance(self.user_id)
        topic_breakdown = SupabaseAgentOps.get_topic_performance(self.user_id)
        
        analysis = {
            "total_attempts": performance.get('total_attempts', 0),
            "recent_accuracy": performance.get('accuracy', 0),
            "topic_breakdown": topic_breakdown,
            "weak_topics": performance.get('weak_topics', []),
            "strong_topics": performance.get('strong_topics', []),
            "recommended_difficulty": "medium"
        }
        
        # Determine difficulty
        if analysis["recent_accuracy"] < 50:
            analysis["recommended_difficulty"] = "easy"
        elif analysis["recent_accuracy"] > 75:
            analysis["recommended_difficulty"] = "hard"
        
        return analysis
    
    def search_sat_resources(self, topic: str, num_results: int = 5, max_retries: int = 3) -> str:
        """Search DuckDuckGo for real SAT questions and resources with retry logic"""
        query = f"SAT {topic} practice questions examples"
        print(f"   🦆 DuckDuckGo searching: '{query}'")
        
        for attempt in range(max_retries):
            try:
                # Create fresh instance for each attempt
                ddg = get_ddg_instance()
                
                # Add delay between retries (exponential backoff)
                if attempt > 0:
                    wait_time = (2 ** attempt) * 2  # 4s, 8s, 16s
                    print(f"   ⏳ Waiting {wait_time}s before retry {attempt + 1}...")
                    time.sleep(wait_time)
                
                results = ddg.text(query, max_results=num_results)
                
                context = f"\n### Real SAT Resources for {topic}:\n"
                found_count = 0
                for i, result in enumerate(results, 1):
                    context += f"{i}. {result['title']}\n   {result['body'][:150]}...\n"
                    found_count += 1
                
                if found_count > 0:
                    print(f"   ✅ Found {found_count} resources for {topic}")
                    return context
                else:
                    print(f"   ⚠️  No results found for {topic}")
                    return ""
                    
            except Exception as e:
                error_msg = str(e)
                if "202" in error_msg or "Ratelimit" in error_msg:
                    if attempt < max_retries - 1:
                        print(f"   ⚠️  Rate limited, will retry...")
                        continue
                    else:
                        print(f"   ⚠️  Rate limit persists after {max_retries} attempts, skipping search")
                else:
                    print(f"   ⚠️  Search error: {e}")
                    if attempt < max_retries - 1:
                        continue
                
                return ""
        
        return ""
    
    def build_agent_context(self, analysis: Dict) -> str:
        """Builds context string for the AI agent"""
        
        context = f"""You are an adaptive SAT learning AI agent. Your goal is to help students improve their SAT scores by generating personalized questions.

STUDENT PROFILE:
- Total Questions Attempted: {analysis['total_attempts']}
- Recent Accuracy: {analysis['recent_accuracy']:.1f}%
- Recommended Difficulty: {analysis['recommended_difficulty']}

WEAK TOPICS (Need Focus):
{', '.join(analysis['weak_topics']) if analysis['weak_topics'] else 'None identified yet'}

STRONG TOPICS (Can challenge more):
{', '.join(analysis['strong_topics']) if analysis['strong_topics'] else 'None identified yet'}

TOPIC PERFORMANCE:
"""
        for topic, data in analysis['topic_breakdown'].items():
            context += f"- {topic}: {data['accuracy']:.1f}% accuracy, {data['attempts']} attempts\n"
        
        return context
    
    async def generate_questions(self, num_questions: int = 50, use_web_search: bool = False) -> List[Dict]:
        """
        Generates personalized SAT questions using AI agent with context
        Can optionally search the web for real SAT question examples
        """
        
        # Analyze performance
        analysis = self.analyze_performance()
        
        # Search for real SAT resources if enabled
        web_context = ""
        if use_web_search:
            print("🔍 Searching web for real SAT questions...")
            
            # If user has weak topics, search those
            if analysis['weak_topics']:
                print(f"   📉 Focusing on weak topics: {', '.join(analysis['weak_topics'][:2])}")
                for i, topic in enumerate(analysis['weak_topics'][:2]):  # Search top 2 weak topics
                    if i > 0:
                        time.sleep(3)  # 3s delay between different topic searches
                    web_context += self.search_sat_resources(topic, num_results=3)
            else:
                # New user - search general SAT topics
                print(f"   📚 New user - searching general SAT topics")
                # Only search 1 topic for new users to avoid rate limits
                web_context += self.search_sat_resources("Algebra", num_results=2)
        
        # Build context for agent
        context = self.build_agent_context(analysis)
        if web_context:
            print(f"   📝 Adding web search results to Claude's context ({len(web_context)} chars)")
            context += "\n" + web_context
        else:
            print(f"   ℹ️  No web search performed (use_web_search={use_web_search})")
        
        # Calculate distribution (focus on weak topics)
        weak_topic_ratio = 0.6  # 60% weak topics
        balanced_ratio = 0.3    # 30% mixed
        strong_topic_ratio = 0.1  # 10% strong topics (to maintain)
        
        weak_count = int(num_questions * weak_topic_ratio)
        balanced_count = int(num_questions * balanced_ratio)
        strong_count = num_questions - weak_count - balanced_count
        
        prompt = f"""{context}

TASK: Generate {num_questions} SAT questions with the following distribution:

1. {weak_count} questions on WEAK TOPICS ({', '.join(analysis['weak_topics']) if analysis['weak_topics'] else 'various topics'})
   - Difficulty: {analysis['recommended_difficulty']} to medium
   - Focus on building fundamentals

2. {balanced_count} questions on MIXED TOPICS
   - Difficulty: medium
   - Help identify new weak areas

3. {strong_count} questions on STRONG TOPICS
   - Difficulty: hard
   - Maintain and challenge mastery

QUESTION FORMAT (JSON array):
[
  {{
    "id": 1,
    "question": "If 2x + 5 = 15, what is the value of x?",
    "options": ["5", "10", "7.5", "3"],
    "correctAnswer": 0,
    "topic": "Algebra",
    "difficulty": "easy",
    "explanation": "2x + 5 = 15, subtract 5: 2x = 10, divide by 2: x = 5",
    "reasoning": "Targeting weak algebra skills"
  }},
  ...
]

IMPORTANT:
- Make questions educational and progressive
- Include clear explanations
- Vary question types within topics
- Questions should build on each other
- Add "reasoning" field explaining why this question helps the student

Generate exactly {num_questions} questions now:"""

        # Call OpenRouter API with Haiku 4.5 (fastest & cheapest!)
        print(f"   🤖 Calling Claude Haiku 4.5 via OpenRouter...")
        response = client.chat.completions.create(
            model="anthropic/claude-haiku-4.5",  # Latest Haiku model!
            messages=[
                {"role": "system", "content": "You are an expert SAT tutor AI that generates personalized practice questions. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=8000
        )
        print(f"   ✅ Claude response received!")
        
        # Parse response
        content = response.choices[0].message.content
        
        # Extract JSON from response
        try:
            # Try to find JSON array in the response
            start_idx = content.find('[')
            end_idx = content.rfind(']') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                questions = json.loads(json_str)
                
                # Store this interaction in context memory
                self.context_memory.append({
                    "analysis": analysis,
                    "generated_count": len(questions),
                    "timestamp": "now"
                })
                
                return questions
            else:
                raise ValueError("No JSON array found in response")
        except Exception as e:
            print(f"Error parsing questions: {e}")
            print(f"Response: {content[:500]}...")
            return []
    
    def update_performance(self, question_attempts: List[Dict], game_data: Dict):
        """Updates user performance after game session in Supabase"""
        
        session_id = SupabaseAgentOps.save_game_session(self.user_id, game_data)
        if session_id:
            SupabaseAgentOps.save_question_attempts(session_id, self.user_id, question_attempts)
            SupabaseAgentOps.update_user_stats(self.user_id, game_data)
    
    async def get_learning_insights(self) -> Dict:
        """Generates personalized learning insights using AI"""
        
        analysis = self.analyze_performance()
        context = self.build_agent_context(analysis)
        
        prompt = f"""{context}

Based on this student's performance, provide:
1. Top 3 areas to focus on
2. Recommended study strategy
3. Motivational insight
4. Next milestone

Respond in JSON:
{{
  "focus_areas": ["area1", "area2", "area3"],
  "strategy": "Study strategy text",
  "motivation": "Motivational message",
  "next_milestone": "Goal description"
}}
"""
        
        response = client.chat.completions.create(
            model="anthropic/claude-haiku-4.5",  # Latest Haiku for insights!
            messages=[
                {"role": "system", "content": "You are a supportive SAT learning coach."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=500
        )
        
        content = response.choices[0].message.content
        
        try:
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            json_str = content[start_idx:end_idx]
            return json.loads(json_str)
        except:
            return {
                "focus_areas": analysis['weak_topics'][:3] if analysis['weak_topics'] else ["Keep practicing!"],
                "strategy": "Continue playing games to identify your strengths and weaknesses.",
                "motivation": "You're on the right track!",
                "next_milestone": "Complete 50 more questions"
            }

