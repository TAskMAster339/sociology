from pathlib import Path
import os
import subprocess, sys, concurrent.futures
root=Path(__file__).resolve().parents[1]
skill=Path(os.environ.get('SOCIOLOGY_DOCUMENTS_SKILL', '/home/TAskMAster339/.codex/plugins/cache/openai-primary-runtime/documents/26.1110.11613/skills/documents'))
renderer=skill/'render_docx.py'
def render(p):
 out=root/'build'/'docx-preview'/p.stem[:2]
 cmd=[sys.executable,str(renderer),str(p),'--output_dir',str(out),'--emit_pdf']
 r=subprocess.run(cmd,capture_output=True,text=True)
 print(p.name,r.returncode,(r.stdout+r.stderr)[-1600:],flush=True)
 return r.returncode
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 codes=list(pool.map(render,sorted((root/'output').glob('*.docx'))))
sys.exit(max(codes))
