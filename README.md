# Smart Khroma — Estúdio Plá
**Monitor de áudio profissional 5.1 · PWA · Sem instalação**

| Campo | Valor |
|---|---|
| Versão | v1.13.0 |
| Família | Smart Suite · Estúdio Plá |
| Tipo | PWA |
| Deploy | Netlify · HTTPS |

## Arquivos
| Arquivo | Editar? |
|---|---|
| `index.html` | ✅ Sim |
| `sw.js` | ✅ Sim — bump CACHE_NAME a cada deploy |
| `manifest.json` | ✅ Sim |
| `support.js` | ❌ NUNCA |

## Deploy
Estrutura plana na raiz. Netlify serve automaticamente.

## Dev local
VS Code + Live Server → `http://127.0.0.1:5500`
F12 → Application → Service Workers → Update on reload + Bypass for network
