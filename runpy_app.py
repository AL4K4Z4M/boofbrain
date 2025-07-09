# runpy_app.py
from flask import Flask, request, render_template_string, Response
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
</body>
</html>
'''

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

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
