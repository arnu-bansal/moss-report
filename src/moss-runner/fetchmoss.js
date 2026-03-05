const http = require("http");

function fetch(url) {
  http.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      fetch(res.headers.location);
      return;
    }
    let html = "";
    res.on("data", c => html += c);
    res.on("end", () => {
      console.log(html.slice(0, 3000));
    });
  });
}

fetch("http://moss.stanford.edu/results/5/1242410278386/match0-0.html");
