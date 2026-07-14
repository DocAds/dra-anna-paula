// Servidor Next custom para o Passenger (CloudLinux Node.js Selector) do cPanel.
// O Passenger carrega este arquivo como app e conecta a porta que passa via PORT;
// por isso usamos next({ dev: false }) e delegamos tudo ao request handler do Next.
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(port);
});
