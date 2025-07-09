# runpy_app.py
<<<<<<< HEAD
from flask import Flask, request, render_template_string
=======
from flask import Flask, request, render_template_string, Response
>>>>>>> 995e269cfb496a29331a1c627c61cdc927dd0152
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
<<<<<<< HEAD
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
=======
    <form id="sherlock-form" style="margin-bottom:1rem;">
        <label for="username">Username:</label>
        <input id="username" name="username" required />
        <button type="submit">Search</button>
    </form>
    <pre id="output" style="white-space:pre-wrap;"></pre>
  </main>
  <div id="footer-placeholder"></div>
  <script src="/js/main.js"></script>
  <script>
    (function(){
      var form = document.getElementById('sherlock-form');
      var output = document.getElementById('output');
      var evtSrc;
      form.addEventListener('submit', function(e){
        e.preventDefault();
        var user = document.getElementById('username').value.trim();
        if(!user) return;
        output.textContent = '';
        if(evtSrc){ evtSrc.close(); }
        evtSrc = new EventSource('/sherlock/stream?username=' + encodeURIComponent(user));
        evtSrc.onmessage = function(ev){ output.textContent += ev.data + '\n'; };
        evtSrc.addEventListener('done', function(){ evtSrc.close(); });
      });
    })();
  </script>
>>>>>>> 995e269cfb496a29331a1c627c61cdc927dd0152
</body>
</html>
'''

<<<<<<< HEAD
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
=======
@app.route("/sherlock")
def sherlock_page():
    return render_template_string(HTML_PAGE)


@app.route("/sherlock/stream")
def sherlock_stream():
    username = request.args.get("username", "").strip()
    if not username:
        return "No username provided", 400

    def generate():
        cmd = ["sherlock", username, "--print-found"]
        with subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1) as proc:
            for line in proc.stdout:
                yield f"data: {line.rstrip()}\n\n"
            proc.wait()
            yield "event: done\ndata: done\n\n"

    return Response(generate(), mimetype="text/event-stream")
>>>>>>> 995e269cfb496a29331a1c627c61cdc927dd0152

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
