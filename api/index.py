from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
import os
import hashlib

# Load .env file for local development
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__)
CORS(app)  # Enable CORS for local development

# Configure Groq
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# Upstash Redis configuration
UPSTASH_REDIS_REST_URL = os.environ.get('UPSTASH_REDIS_REST_URL')
UPSTASH_REDIS_REST_TOKEN = os.environ.get('UPSTASH_REDIS_REST_TOKEN')

# Rate limit settings
RATE_LIMIT_MAX_REQUESTS = 30
RATE_LIMIT_WINDOW_SECONDS = 60 * 60  # 1 hour

# ============================================================================
# META-PROMPT TEMPLATES (The Secret Sauce)
# ============================================================================

EVALUATION_SYSTEM_PROMPT = '''You are a **senior prompt engineer** participating in the **Prompt Evaluation Chain**. Your task is to analyze and score prompts using a 35-criteria rubric.

## Evaluation Criteria (Score 1-5 each):
1. Clarity & Specificity  
2. Context / Background Provided  
3. Explicit Task Definition
4. Feasibility within Model Constraints
5. Avoiding Ambiguity or Contradictions 
6. Model Fit / Scenario Appropriateness
7. Desired Output Format / Style
8. Use of Role or Persona
9. Step-by-Step Reasoning Encouraged 
10. Structured / Numbered Instructions
11. Brevity vs. Detail Balance
12. Iteration / Refinement Potential
13. Examples or Demonstrations
14. Handling Uncertainty / Gaps
15. Hallucination Minimization
16. Knowledge Boundary Awareness
17. Audience Specification
18. Style Emulation or Imitation
19. Memory Anchoring (Multi-Turn Systems)
20. Meta-Cognition Triggers
21. Divergent vs. Convergent Thinking Management
22. Hypothetical Frame Switching
23. Safe Failure Mode
24. Progressive Complexity
25. Alignment with Evaluation Metrics
26. Calibration Requests 
27. Output Validation Hooks
28. Time/Effort Estimation Request
29. Ethical Alignment or Bias Mitigation
30. Limitations Disclosure
31. Compression / Summarization Ability
32. Cross-Disciplinary Bridging
33. Emotional Resonance Calibration
34. Output Risk Categorization
35. Self-Repair Loops

Provide a concise evaluation with:
- Total score out of 175
- Top 3 strengths
- Top 5-7 actionable refinement suggestions'''

REFINEMENT_SYSTEM_PROMPT = '''You are a **senior prompt engineer** in the **Prompt Refinement Chain**. Your task is to transform a raw prompt into an elite, AI-optimized instruction.

## Apply these enhancements:
1. Assign a highly specific role/persona if missing
2. Convert vague tasks into specific, actionable sub-tasks
3. Define explicit output format (Markdown, Table, Code Block, etc.)
4. Add "Anti-Hallucination" guardrails (e.g., "If you don't know, say so")
5. Include step-by-step reasoning encouragement where helpful
6. Eliminate ambiguity and redundancy
7. Strengthen structure and instructional flow

## Output Format:
Provide ONLY the refined prompt in clean, ready-to-use format. No explanations or meta-commentary. The refined prompt should be self-contained and immediately usable.'''


def get_client_ip():
    """Extract client IP from request, handling proxies."""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    if request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    return request.remote_addr or 'unknown'


def hash_ip(ip):
    """Hash IP for privacy-conscious rate limiting."""
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


def check_rate_limit(ip_hash):
    """Check rate limit using Upstash Redis REST API."""
    if not UPSTASH_REDIS_REST_URL or not UPSTASH_REDIS_REST_TOKEN:
        # Skip rate limiting if Redis not configured
        return True, RATE_LIMIT_MAX_REQUESTS
    
    import urllib.request
    import json
    
    key = f"promptelevate:ratelimit:{ip_hash}"
    
    try:
        # Get current count
        url = f"{UPSTASH_REDIS_REST_URL}/get/{key}"
        req = urllib.request.Request(url)
        req.add_header('Authorization', f'Bearer {UPSTASH_REDIS_REST_TOKEN}')
        
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read())
            current_count = int(data.get('result') or 0)
        
        if current_count >= RATE_LIMIT_MAX_REQUESTS:
            return False, 0
        
        # Increment count with expiry
        pipeline_url = f"{UPSTASH_REDIS_REST_URL}/pipeline"
        pipeline_data = json.dumps([
            ["INCR", key],
            ["EXPIRE", key, RATE_LIMIT_WINDOW_SECONDS]
        ]).encode()
        
        req = urllib.request.Request(pipeline_url, data=pipeline_data, method='POST')
        req.add_header('Authorization', f'Bearer {UPSTASH_REDIS_REST_TOKEN}')
        req.add_header('Content-Type', 'application/json')
        
        with urllib.request.urlopen(req, timeout=5) as response:
            pass
        
        return True, RATE_LIMIT_MAX_REQUESTS - current_count - 1
        
    except Exception as e:
        print(f"Rate limit check error: {e}")
        # Allow request on Redis error
        return True, RATE_LIMIT_MAX_REQUESTS


def call_groq(system_message, user_message):
    """Call Groq API with Llama 3.3 70B."""
    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ],
        temperature=0.5,
        max_tokens=2048,
    )
    return completion.choices[0].message.content


def run_meta_prompt_engine(user_prompt):
    """Run the two-phase Meta-Prompt engine using Groq."""
    if not groq_client:
        raise ValueError("GROQ_API_KEY not configured")
    
    try:
        # Phase 1: Evaluation
        print("Starting Phase 1: Evaluation...")
        evaluation = call_groq(
            EVALUATION_SYSTEM_PROMPT,
            f"Evaluate this prompt:\n\n```\n{user_prompt}\n```"
        )
        print("Phase 1 complete!")
        
        # Phase 2: Refinement
        print("Starting Phase 2: Refinement...")
        refined_prompt = call_groq(
            REFINEMENT_SYSTEM_PROMPT,
            f"Original Prompt:\n```\n{user_prompt}\n```\n\nEvaluation Insights:\n{evaluation}\n\nCreate the refined prompt now."
        )
        print("Phase 2 complete!")
        
        return evaluation, refined_prompt
    except Exception as e:
        print(f"Groq API error: {e}")
        raise ValueError(f"AI processing failed: {str(e)}")


@app.route('/api/supercharge', methods=['POST'])
def supercharge():
    """Main API endpoint for prompt transformation."""
    try:
        data = request.get_json()
        if not data or 'prompt' not in data:
            return jsonify({'error': 'Missing prompt in request body'}), 400
        
        user_prompt = data['prompt'].strip()
        if not user_prompt:
            return jsonify({'error': 'Prompt cannot be empty'}), 400
        
        if len(user_prompt) > 10000:
            return jsonify({'error': 'Prompt too long (max 10,000 characters)'}), 400
        
        # Rate limiting
        client_ip = get_client_ip()
        ip_hash = hash_ip(client_ip)
        allowed, remaining = check_rate_limit(ip_hash)
        
        if not allowed:
            return jsonify({
                'error': 'Rate limit exceeded. You have used all 30 prompts. Please try again in an hour.',
                'remaining': 0
            }), 429
        
        # Run the Meta-Prompt engine
        evaluation, refined_prompt = run_meta_prompt_engine(user_prompt)
        
        return jsonify({
            'evaluation': evaluation,
            'refined_prompt': refined_prompt,
            'remaining': remaining
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        print(f"Error in supercharge: {e}")
        return jsonify({'error': 'An unexpected error occurred. Please try again.'}), 500


@app.route('/api/status', methods=['GET'])
def status():
    """Get rate limit status without consuming a request."""
    client_ip = get_client_ip()
    ip_hash = hash_ip(client_ip)
    
    if not UPSTASH_REDIS_REST_URL or not UPSTASH_REDIS_REST_TOKEN:
        # No rate limiting configured
        return jsonify({
            'remaining': RATE_LIMIT_MAX_REQUESTS,
            'limit': RATE_LIMIT_MAX_REQUESTS,
            'limited': False
        })
    
    import urllib.request
    import json
    
    key = f"promptelevate:ratelimit:{ip_hash}"
    
    try:
        url = f"{UPSTASH_REDIS_REST_URL}/get/{key}"
        req = urllib.request.Request(url)
        req.add_header('Authorization', f'Bearer {UPSTASH_REDIS_REST_TOKEN}')
        
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read())
            current_count = int(data.get('result') or 0)
        
        remaining = max(0, RATE_LIMIT_MAX_REQUESTS - current_count)
        return jsonify({
            'remaining': remaining,
            'limit': RATE_LIMIT_MAX_REQUESTS,
            'limited': remaining == 0
        })
    except Exception as e:
        print(f"Status check error: {e}")
        return jsonify({
            'remaining': RATE_LIMIT_MAX_REQUESTS,
            'limit': RATE_LIMIT_MAX_REQUESTS,
            'limited': False
        })


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'groq_configured': bool(GROQ_API_KEY),
        'redis_configured': bool(UPSTASH_REDIS_REST_URL)
    })


# For local development
if __name__ == '__main__':
    app.run(debug=True, port=5000)
