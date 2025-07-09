# runpy_app.py
from flask import Flask, request, render_template_string
import subprocess

app = Flask(__name__, static_folder='.', static_url_path='')

HTML_PAGE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>boofbrain — Sherlock Search</title>
    <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  <div id="header-placeholder"></div>
  <main class="content-wrapper">
    <h1>Sherlock Username Search</h1>
    <form method="POST" style="margin-bottom:1rem;">
        <label for="username">Username:</label>
        <input id="username" name="username" value="{{username or ''}}" required />
        <button type="submit">Search</button>
    </form>
    {% if urls %}
      <ul>
      {% for url in urls %}
        <li><a href="{{url}}" target="_blank" rel="noopener">{{url}}</a></li>
      {% endfor %}
      </ul>
    {% elif results %}
      <pre>{{results}}</pre>
    {% endif %}
  </main>
  <div id="footer-placeholder"></div>
  <script src="/js/main.js"></script>
</body>
</html>
'''

@app.route("/sherlock", methods=["GET", "POST"])
def sherlock_search():
    username = ""
    results = ""
    urls = []
    if request.method == "POST":
        username = request.form["username"].strip()
        try:
            cmd = ["sherlock", username, "--print-found"]
            proc = subprocess.run(cmd, capture_output=True, text=True)
            output = proc.stdout if proc.returncode == 0 else proc.stderr
            results = output
            urls = [line.strip() for line in output.splitlines() if line.strip().startswith("http")]
        except Exception as e:
            results = f"Error: {e}"
    return render_template_string(HTML_PAGE, results=results, urls=urls, username=username)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
