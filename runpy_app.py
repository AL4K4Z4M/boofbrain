# runpy_app.py
from flask import Flask, request, render_template_string
import sherlock

app = Flask(__name__)

HTML_FORM = '''
<!DOCTYPE html>
<html>
<head>
    <title>Sherlock Username Search</title>
</head>
<body>
    <h2>Sherlock Username Search</h2>
    <form method="POST">
        <label>Username to search:</label>
        <input name="username" required>
        <button type="submit">Search</button>
    </form>
    <pre>{{results}}</pre>
</body>
</html>
'''

@app.route("/sherlock", methods=["GET", "POST"])
def sherlock_search():
    results = ""
    if request.method == "POST":
        username = request.form["username"]
        try:
            # Sherlock CLI interface: run as subprocess for best reliability
            import subprocess
            cmd = ["sherlock", username, "--print-found"]
            proc = subprocess.run(cmd, capture_output=True, text=True)
            results = proc.stdout if proc.returncode == 0 else proc.stderr
        except Exception as e:
            results = f"Error: {e}"
    return render_template_string(HTML_FORM, results=results)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
