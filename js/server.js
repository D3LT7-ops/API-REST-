const WebSocket = require("ws");
const { spawn } = require("child_process");

// Cria servidor WebSocket para o navegador
const wss = new WebSocket.Server({ port: 3000 });
console.log("WebSocket server rodando em ws://localhost:3000");

// Spawn do executável rtf (finance-websocket-API)
const rtf = spawn("./rtf", ["serve", "--port", "8080"]); // ajuste caminho se necessário

rtf.stdout.on("data", (data) => console.log(`RTF: ${data}`));
rtf.stderr.on("data", (data) => console.error(`RTF ERRO: ${data}`));
rtf.on("close", (code) => console.log(`RTF finalizou com código ${code}`));

// Conecta no servidor rtf local
const rtfSocket = new WebSocket("ws://localhost:8080");

wss.on("connection", (ws) => {
    console.log("Cliente conectado.");

    ws.on("message", (message) => {
        // Recebe do navegador o ticker que quer acompanhar
        rtfSocket.send(message);
    });

    rtfSocket.on("message", (msg) => {
        // Envia os dados recebidos do rtf para o navegador
        ws.send(msg);
    });
});
