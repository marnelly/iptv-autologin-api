const http = require('http');
const https = require('https');

const IPTV_API = 'https://p2player.top/api/chatbot/80m1EGKDlE/gQBWQ5WGRe';
const AUTOLOGIN_BASE = 'https://storage.googleapis.com/runable-templates/cli-uploads%2FOVDYksqquITP5cpk1BNxe5BZkDMPDvQ0%2FgSfJ4UvsRRxi5f9h3HLSD%2Fautologin.html';

function callIptvApi() {
  return new Promise((resolve, reject) => {
    const req = https.request(IPTV_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': 0 }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function buildAutoLoginLink(username, password, expiresAt) {
  const expMs = new Date(expiresAt).getTime();
  return `${AUTOLOGIN_BASE}?u=${encodeURIComponent(username)}&p=${encodeURIComponent(password)}&exp=${expMs}`;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.url === '/gerar-teste' && (req.method === 'POST' || req.method === 'GET')) {
    try {
      const iptv = await callIptvApi();
      const { username, password, expiresAt, expiresAtFormatted } = iptv;
      const link = buildAutoLoginLink(username, password, expiresAt);

      const reply =
        `🎉 Teste liberado com sucesso!\n\n` +
        `Aqui estão seus dados de acesso 👇\n\n` +
        `🖥️ Código servidor: p2player\n` +
        `👤 Usuário: ${username}\n` +
        `🔑 Senha: ${password}\n` +
        `⏳ Válido até: ${expiresAtFormatted}\n\n` +
        `🔗 *Clique aqui para entrar direto (sem digitar nada):*\n` +
        `${link}\n\n` +
        `Qualquer dúvida ou se quiser assinar depois, é só me chamar 😉`;

      res.writeHead(200);
      res.end(JSON.stringify({
        username,
        password,
        expiresAt,
        expiresAtFormatted,
        autologin_link: link,
        reply,
        data: [{ message: reply }]
      }));
    } catch(e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Erro ao gerar teste', detail: e.message }));
    }
  } else if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ API rodando na porta ${PORT}`));
