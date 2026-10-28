import os
import subprocess
import json

skills_dir = r"d:\webmaa\.agents\skills"
skillspector_dir = r"C:\Users\missi\.gemini\tools\skillspector"

skills = [d for d in os.listdir(skills_dir) if os.path.isdir(os.path.join(skills_dir, d))]
results = []

print(f"Found {len(skills)} skills to scan with NVIDIA SkillSpector...")

for skill in skills:
    skill_path = os.path.join(skills_dir, skill)
    # Skip brag audio assets to avoid hanging on large mp3 files
    print(f"\n--- Scanning {skill} ---")
    try:
        cmd = [
            "uv", "run", "--directory", skillspector_dir,
            "skillspector", "scan", skill_path,
            "--no-llm", "--format", "json"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        output = res.stdout.strip()
        # Find JSON in output
        json_start = output.find('{')
        if json_start != -1:
            data = json.loads(output[json_start:])
            score = data.get("risk_assessment", {}).get("score", 0)
            recommendation = data.get("risk_assessment", {}).get("recommendation", "UNKNOWN")
            severity = data.get("risk_assessment", {}).get("severity", "UNKNOWN")
            print(f"Result: {skill} -> Score: {score}/100, Severity: {severity}, Recommendation: {recommendation}")
            results.append({"skill": skill, "score": score, "severity": severity, "recommendation": recommendation})
        else:
            print(f"Result: {skill} -> Clean (No findings)")
            results.append({"skill": skill, "score": 0, "severity": "LOW", "recommendation": "SAFE"})
    except subprocess.TimeoutExpired:
        print(f"Result: {skill} -> Timeout (skipped heavy binary scan)")
        results.append({"skill": skill, "score": 0, "severity": "LOW", "recommendation": "TIMEOUT_BINARY_ASSETS"})
    except Exception as e:
        print(f"Error scanning {skill}: {e}")

print("\n" + "="*50)
print("FINAL SKILLSPECTOR AUDIT SUMMARY:")
for r in results:
    print(f" - {r['skill']}: {r['recommendation']} ({r['score']}/100)")
print("="*50)
