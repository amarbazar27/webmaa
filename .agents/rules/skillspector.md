# NVIDIA SkillSpector Security Protocol

Before installing, cloning, or integrating any third-party repository, GitHub skill, tool, or MCP package:
1. Run NVIDIA SkillSpector:
   ```bash
   uv run --directory C:\Users\missi\.gemini\tools\skillspector skillspector scan <target_path_or_url> --no-llm
   ```
2. Check Risk Assessment:
   - Score must be LOW / SAFE (no data exfiltration, no prompt injection, no malicious shell commands).
   - If findings exist, report exact risks to the user and refuse installation until explicitly confirmed.
