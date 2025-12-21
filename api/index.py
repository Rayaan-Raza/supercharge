from flask import Flask, request, jsonify
import google.generativeai as genai
import os
import hashlib
import time

app = Flask(__name__)

# Configure Gemini
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Upstash Redis configuration
UPSTASH_REDIS_REST_URL = os.environ.get('UPSTASH_REDIS_REST_URL')
UPSTASH_REDIS_REST_TOKEN = os.environ.get('UPSTASH_REDIS_REST_TOKEN')

# Rate limit settings
RATE_LIMIT_MAX_REQUESTS = 5
RATE_LIMIT_WINDOW_SECONDS = 12 * 60 * 60  # 12 hours

# ============================================================================
# META-PROMPT TEMPLATES (The Secret Sauce)
# ============================================================================

EVALUATION_PROMPT = '''🔁 Prompt Evaluation Chain 2.0
You are a **senior prompt engineer** participating in the **Prompt Evaluation Chain**. Your task is to **analyze and score a given prompt** following the detailed rubric below.

## 🎯 Evaluation Instructions

1. **Review the prompt** provided inside triple backticks.
2. **Evaluate the prompt** using the **35-criteria rubric** below.
3. For **each criterion**: Assign a **score** from 1 (Poor) to 5 (Excellent), identify **one clear strength**, suggest **one specific improvement**, and provide a **brief rationale** (1–2 sentences).
4. **Calculate and report** the total score out of 175.
5. **Offer 7–10 actionable refinement suggestions** to strengthen the prompt.

## ⚡ Quick Mode (Use for shorter prompts)
- Group similar criteria
- Write condensed strengths/improvements (2–3 words)
- Use simpler total scoring estimate

## 📊 Evaluation Criteria Rubric

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

## 📥 Prompt to Evaluate

```
{user_prompt}
```

Provide a concise evaluation with total score and top 7-10 refinement suggestions.'''

REFINEMENT_PROMPT = '''🔁 Prompt Refinement Chain 2.0
You are a **senior prompt engineer** participating in the **Prompt Refinement Chain**. Your task is to **revise a prompt** based on the evaluation insights, ensuring the new version is clearer, more effective, and aligned with best practices.

## 🔄 Refinement Instructions

1. **Apply relevant improvements**, including:
   - Enhancing clarity, precision, and conciseness
   - Eliminating ambiguity, redundancy, or contradictions
   - Strengthening structure, formatting, instructional flow
   - Adding persona, output format, and anti-hallucination guardrails

2. **Preserve throughout your revision**:
   - The original **purpose** and **functional objectives**
   - Logical, **numbered instructional structure** where appropriate

3. **Apply these enhancements automatically**:
   - Assign a highly specific role/persona if missing
   - Convert vague tasks into specific, actionable sub-tasks
   - Define explicit output format (Markdown, Table, Code Block, etc.)
   - Add "Anti-Hallucination" guardrails (e.g., "If you don't know, say so")
   - Include step-by-step reasoning encouragement where helpful

## 📤 Original Prompt

```
{user_prompt}
```

## 📊 Evaluation Insights

{evaluation}

## 🛠️ Output Format

Provide ONLY the refined prompt in clean, ready-to-use format. Do not include explanations or meta-commentary. The refined prompt should be self-contained and immediately usable.'''


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


def run_meta_prompt_engine(user_prompt):
    """Run the two-phase Meta-Prompt engine."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    # Phase 1: Evaluation
    eval_prompt = EVALUATION_PROMPT.format(user_prompt=user_prompt)
    eval_response = model.generate_content(eval_prompt)
    evaluation = eval_response.text
    
    # Phase 2: Refinement
    refine_prompt = REFINEMENT_PROMPT.format(
        user_prompt=user_prompt,
        evaluation=evaluation
    )
    refine_response = model.generate_content(refine_prompt)
    refined_prompt = refine_response.text
    
    return evaluation, refined_prompt


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
                'error': 'Rate limit exceeded. Please try again later (5 requests per 12 hours).'
            }), 429
        
        # Run the Meta-Prompt engine
        evaluation, refined_prompt = run_meta_prompt_engine(user_prompt)
        
        return jsonify({
            'evaluation': evaluation,
            'refined_prompt': refined_prompt,
            'remaining_requests': remaining
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        print(f"Error in supercharge: {e}")
        return jsonify({'error': 'An unexpected error occurred. Please try again.'}), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'gemini_configured': bool(GEMINI_API_KEY),
        'redis_configured': bool(UPSTASH_REDIS_REST_URL)
    })


# For local development
if __name__ == '__main__':
    app.run(debug=True, port=5000)
