from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
print('Pageant Index Philippines: http://localhost:4173')
ThreadingHTTPServer(('0.0.0.0', 4173), SimpleHTTPRequestHandler).serve_forever()
