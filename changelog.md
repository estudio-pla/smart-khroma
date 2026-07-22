# Changelog — Smart Khroma

## [v1.22.0] — 2026-07-22

### FIX — Frame rate padronizado em 25fps (era 30fps, entregando ~13-16fps real)
- Diagnóstico feito em cima dos 3 arquivos reais entregues pelo Kaue
  (REC, Export MP4, PLA Render): frame rate médio de verdade ficava em
  13-16fps mesmo pedindo 30fps ao `captureStream()`, com engasgos de
  até 635ms. Causa: o ScriptProcessor que força o redesenho do
  composite (buffer 2048 ≈ 43ms de intervalo real) já estourava
  sozinho o orçamento de 33ms exigido por 30fps.
- `captureStream(30)` → `captureStream(25)` nos 3 caminhos (REC, Export
  MP4, PLA Render). Throttle do `_drawComposite()`: 31ms → 40ms. Buffer
  do ScriptProcessor: 2048 → 1024 (~21ms de intervalo real, folga real
  sob os 40ms de orçamento em vez de faltar).

### Plano confirmado com o Kaue — 2 etapas
1. **Esta versão**: padronizar em 25fps na captura ao vivo (mitigação
   rápida).
2. **Próxima**: motor de Render offline (`OfflineAudioContext`, sem
   tempo real) — resultado final preciso, fps mais alto, sem as
   limitações da captura ao vivo. Entrega rápida primeiro (qualquer
   formato), render de qualidade depois, sob demanda.

## [v1.21.0] — 2026-07-22

### FIX CRÍTICO — Fader MASTER trocado por deslizante fixo
- O popup vertical da v1.20 (mesmo já com o binding corrigido) ainda
  travava em teste real ao arrastar — relatado com vídeo. Em vez de
  insistir no popup, trocado por completo: **deslizante horizontal
  fixo, sempre visível**, do lado do texto MSTR, sem clique pra abrir e
  sem tampar o VU. Grade de dB e alvos de loudness (-14 Spotify/
  -16 Stream/-23 EBU/-24 Bcast) viraram tick-marks direto na barra.

### FEAT — Ganho de Entrada arrastável
- A barra que só respondia aos botões +/- agora também arrasta,
  mesmo padrão de interação do MASTER.

### Regra de processo
- A partir desta versão, toda alteração ganha número de versão
  próprio — sem reaproveitar o mesmo v1.X pra vários fixes.

## [v1.20.0] — 2026-07-22

### FIX CRÍTICO — Exportação MP4 sem vídeo (3 causas, todas corrigidas)
- `onExportMP4` original: caminho principal (WebCodecs + mp4-muxer)
  codificava só o `AudioBuffer` offline — nunca capturava o canvas, o
  `.mp4` baixado saía sem vídeo nenhum.
- 1ª correção: trocou pra `MediaRecorder(canvas+áudio)`, mas tocava por
  um `AudioBufferSourceNode` independente, desligado da cadeia real
  (Neve/SSL/Studer) — o vídeo saía com 0 bytes.
- 2ª correção: passou a tocar pela cadeia real via `_startFile()` e
  capturar `recTapStereo` — ainda 0 bytes. Causa raiz de verdade:
  `_drawComposite()` (a função que desenha o canvas 1920×990 exportado)
  tinha uma trava `if(!this.gravando) return` — só desenhava durante
  gravação REC. A exportação MP4 nunca liga `this.gravando`, então o
  canvas ficava sempre preto, não importa o que mais estivesse certo.
  **Esse mesmo bug afetava o PLA Render** (`onPLARender`), que também
  nunca liga `this.gravando` — os vídeos por fonograma da playlist
  saíam pretos há quem sabe quantas versões, mascarado porque o WAV
  separado sempre saía correto.
- Correção final: guard de `_drawComposite()` agora aceita
  `this.gravando || this._exporting || this.state.plaActive`. Export
  MP4 delega pros mesmos dois caminhos já comprovados do REC
  (`_startMp4RecWebCodecs` H.264+AAC via WebCodecs, com fallback pra
  `_startFallbackRec` MediaRecorder nativo/WebM) em vez de reinventar a
  captura. Testado de ponta a ponta: arquivo exportado confirmado com
  trilha de vídeo (VP8) E áudio (Opus) reais, frames mostrando a tela
  de análise de verdade.

### FIX CRÍTICO — Fader MASTER travava o app inteiro ao arrastar
- O overlay/track do fader usava `onClick="window.SmartKhroma&&..."` e
  `onPointerDown/Move/Up="window.SmartKhroma&&..."` — strings de JS cru
  como atributo HTML, em vez do binding de handler do framework
  (`{{ nomeDoHandler }}`) usado em todo o resto do app. O runtime
  (React) tentava atribuir essa string como prop de evento e lançava
  "Minified React error #231" (listener não é function) a cada
  pointerdown/move/up — trava a interface inteira enquanto o dedo/mouse
  está sobre o fader. Provavelmente a causa do "trava tudo, não desliga
  nem funciona" relatado ao vivo. Corrigido pro binding correto +
  `onPointerCancel` adicionado (solta o dedo fora da tela sem perder o
  estado do arraste).

### FIX — Legenda do VU de Input nunca aparecia
- `_buildMeterLegend` rodava uma vez no `componentDidMount`, antes do
  menu de configurações (montado condicionalmente) existir no DOM —
  o elemento nunca era encontrado e a legenda ficava vazia pra sempre,
  mesmo depois de abrir o menu. Chamada movida pra `onMenuToggle`,
  toda vez que o menu abre.

### Fader MASTER — grade de loudness target
- Grade de dB (`+12/+6/0/-6/-10/-20/-40`) ganhou uma segunda coluna no
  lado oposto do track com os alvos de loudness de referência:
  `-14 Spotify · -16 Stream · -23 EBU · -24 Bcast`.

### VU Meter de INPUT (novo)
- Barra horizontal LED-segmento no menu de Ganho de Entrada, lendo o
  sinal real pré-Neve/SSL/Studer (pós ganho de entrada) via analysers
  dedicados (`this.inputAnL`/`this.inputAnR`), ligados direto no
  splitter — nunca reaproveitados pela matriz 5.1. Legenda com
  `BCAST / EBU / STREAM / CLIP`.

### VU Meter de MASTER — marcações de referência
- Tick-marks nos pontos -24/-18/-12/-6/0 dBFS, mesma referência do VU
  de Input, desenhadas direto no canvas (compacto demais pra texto).

### Confirmado
- NEVE 1073 e STUDER A800 já estavam fora da interface principal desde
  a v1.19 — os controles reais (EQ, drive) seguem no menu de
  configurações, com a lógica de processamento intacta.

## [v1.18.0] — 2026-07-21

### FIX CRÍTICO — Pipoca e Vídeo
- Draw loop: `requestAnimationFrame` → `setTimeout(33ms)`.
  rAF sincroniza com o vsync do display (60Hz) e compete com o
  AudioContext scheduler — causa raiz do pipoca no PLAY puro em todas
  as máquinas. setTimeout(33) = 30fps fixo, desacoplado do display.
- `_processAudio()` removido do `ScriptProcessor.onaudioprocess`.
  Ler 6 AnalyserNodes + calcular LUFS dentro de callback ScriptProcessor
  bloqueia a thread principal no momento do callback de áudio — causa
  pipoca severo E corrompe frames do vídeo gravado. Os níveis são
  calculados pelo `_tick()` a 30fps, suficiente para medidores e composite.

### Fader Mobile
- Overlay de controle de ganho para toque em mobile/tablet.
  Ao tocar em MASTER abre um slider horizontal grande com animação
  slide-in (0.28s), fecha ao tocar fora ou após 3s sem interação.
  Arquitetura extensível: `_openFader(label, min, max, getVal, setVal)`
  — NEVE, STUDER e trims de canal entram nas próximas versões.

### UI
- Versão visível em 3 pontos da interface: menu lateral, badge de
  equipamento e tela de standby. "Smart Khroma · v1.18 · PLA".

### Herdado da v1.17
- PLA v0.1: motor 5.1 documentado como Processamento Linear Ambiônico
- Neve 1073 e Studer A800 entram desligados por padrão
- Goniômetro/Phasescope throttle: 60fps → 30fps

# Changelog — Smart Khroma

## [v1.16.0] — 2026-07-19

### Performance — captura do WAV 6ch tirada da thread principal
- Pista nova investigando o pipoca: você relatou que acontece no PLAY puro
  (sem gravar), em duas máquinas diferentes — isso não bate com a causa
  do vídeo travado (aquela correção só age durante REC). Aponta pra carga
  de processamento na thread principal durante qualquer reprodução
- Os 6 ScriptProcessorNode que capturam o WAV 6ch (rodavam o tempo todo
  que tem áudio tocando, não só durante REC — despacham callback na
  THREAD PRINCIPAL, é uma API depreciada por causa disso) foram trocados
  por AudioWorkletNode, que roda na thread de áudio dedicada. Mesma
  função, mesmo formato de dado — só tira esse trabalho de cima da thread
  que também cuida da tela/interação
- Cai automaticamente pro ScriptProcessor antigo se o navegador não tiver
  AudioWorklet (compatibilidade), sem quebrar nada
- Testado: WAV 6ch continua capturando os dados certos com o novo
  caminho. Ainda não é garantia de que resolve o pipoca sozinho — mas é
  uma redução real e mensurável de carga na thread principal durante
  qualquer reprodução, não só gravação

## [v1.15.0] — 2026-07-19

### Neve 1073 — EQ real implementado (pedido direto: "quero aprender o de verdade")
- Nova unidade de canal, topologia igual ao hardware real, entrando ANTES
  do SSL (mic → Neve 1073 → SSL → Studer → Limiter, igual um estúdio de
  verdade encadearia):
  - **Corte de grave (HPF)**: chaveado — OFF / 50 / 80 / 160 / 300 Hz
  - **Grave (shelf)**: frequência chaveada — 35 / 60 / 110 / 220 Hz, ganho
    ±16dB
  - **Médio (a banda "varredura" característica do 1073)**: frequência
    chaveada — 360 / 700 / 1.6k / 3.2k / 4.8k / 7.2k Hz, ganho ±18dB
  - **Agudo (shelf)**: fixo em 12kHz (igual o hardware real — não é
    ajustável em frequência), ganho ±16dB
- Controles reais no menu por enquanto (a página dedicada, arrastável,
  ainda vem depois) — testado com tom de teste em várias frequências:
  HPF em 300Hz derrubou ~91% do sinal em 60Hz, boost de médio em +12dB
  aumentou o nível medido de verdade. Não é cosmético, mexe no sinal real

## [v1.14.0] — 2026-07-19

### Correlação L/R — agora escolhe entrada ou saída
- Pergunta direta: a leitura sempre foi feita pré-efeitos (entrada — antes
  de Neve/SSL/Studer). Adicionado botão CORR: IN/OUT no cabeçalho do
  Phasescope pra alternar pra saída (pós tudo, o que grava/monitora)

### Gamepad — stick esquerdo ajusta o Neve devagar, de propósito
- Novo: mover o stick esquerdo pra cima/baixo ajusta o drive do Neve de
  forma contínua e lenta (analógico de verdade, não só passo a passo) —
  velocidade pensada pra ser detalhada, dá pra regular depois

## [v1.13.0] — 2026-07-19

### RIDER — o rodapé finalmente mostra o valor de verdade
- Achado direto: scroll no RIDER já ajustava o teto real do limitador
  (dBTP), mas o texto do rodapé nunca refletia isso — mostrava "ON/OFF ·
  LUFS", sobra do rider antigo (removido na v1.3.0, perseguia um alvo de
  LUFS). Mexia o valor de verdade sem mostrar nada — exatamente o tipo de
  coisa que pedido direto chamou de "não profissional"
- Agora sempre mostra o teto em dBTP; com o mostrador ligado (clique),
  soma a redução ao vivo que o limitador está aplicando naquele momento

## [v1.12.0] — 2026-07-19

### RST — exige confirmação agora (bug de perda de trabalho corrigido)
- Reportado: tocar sem querer no RST no tablet apagava todos os ajustes
  de fader feitos. Corrigido: primeiro toque só arma (mostra "CONFIRMA?"
  por 2s), só reseta de verdade no segundo toque dentro dessa janela. Um
  toque acidental sozinho nunca mais reseta nada

### Fader +/- — alvo de toque bem maior, e sincronizado com o desenho
- Achado no meio da investigação: o tamanho desenhado dos botões +/- e a
  área que realmente aceitava o toque usavam fórmulas diferentes (uma
  fração da altura do medidor vs. 14px fixo) — podiam nem bater um com o
  outro dependendo do tamanho da tela. Agora usam a mesma fórmula, e ela
  ficou bem maior (dobrou+)

### Investigações em andamento (sem solução ainda, documentado com honestidade)
- **Neve+Studer juntos soando tipo "coro"/dobrado**: rastreei a cadeia
  inteira no código, não achei conexão duplicada — a lógica de liga/
  desliga de ambos parece correta. Tentei um teste de resposta a impulso
  pra flagrar na prática, sem resultado conclusivo ainda. Segue aberto
- **Solo dos canais traseiros indo pra frente no Pro Logic real**: motivo
  técnico identificado (ver conversa) — precisa de decisão sobre escopo
  antes de implementar

## [v1.11.0] — 2026-07-19

### MASTER — VU de verdade adicionado
- Faltava mesmo um medidor de nível do master, só existia o número de
  trim. Agora tem um mini-VU no rodapé, L em cima / R embaixo, mesmo
  estilo LED dos canais — lê o sinal pós-tudo (mesmo ponto que alimenta
  o REC)

### NEVE — rótulo atualizado
- "NEVE" agora mostra "NEVE 1073", referência ao pré/EQ real que inspira
  a curva de saturação

### Sobre o "sem áudio" reportado
- Investigado: se você estava monitorando o microfone (sem arquivo
  carregado, PLAY liga o monitor do mic) e não ouviu nada — isso é o
  comportamento novo da v1.8.0 (correção da realimentação): o retorno do
  mic pro alto-falante agora nasce SEMPRE mudo, de propósito, e só liga
  apertando o botão **MON**. Não é bug, é a proteção contra o apito
  fazendo o trabalho dela — mas concordo que sem esse aviso parece que
  quebrou. Testado e confirmado: a GRAVAÇÃO em si (o arquivo) continua
  captando o áudio real de qualquer forma, independente do MON estar
  ligado ou não — o MON só afeta o que sai pela caixa ao vivo, nunca o
  que é salvo
- Se o problema for outro (por exemplo com arquivo carregado, não com
  mic), me avisa com mais detalhe que reabro a investigação

### REC ainda pipocando — atualização do processo de investigação
- Ainda não resolvido. Mas agora tenho decodificador de vídeo de verdade
  disponível aqui pra examinar os frames da próxima gravação diretamente
  (antes só dava pra analisar por bytes do arquivo, sem ver a imagem em
  si) — manda a próxima gravação que travar/pipocar que a análise vai
  ser bem mais precisa

## [v1.10.0] — 2026-07-19

### Novo: mesinha MIDI caseira (Arduino Leonardo) via Web MIDI
- Suporte a controlador físico MIDI direto no navegador (Chrome), sem
  instalar nada — usa a Web MIDI API nativa
- Protocolo simples e próprio (não Mackie Control — pesado demais pra
  esse hardware): cada botão manda Note On/Off, cada nobe manda CC
  relativo. Sketch novo pro Arduino Leonardo incluído separadamente
  (`smart_khroma_midi.ino`), com todos os pinos comentados pra ajustar
  conforme a fiação real
- Mesinha tem 2 canais físicos, Smart Khroma é 5.1 (6 canais) — os 2
  nobes controlam sempre um "banco" de 2 canais por vez (L/R → C/LFE →
  Ls/Rs); segurar o encoder do canal A por 600ms troca o banco
- Por canal físico: nobe ajusta o trim (clique reseta pra 0dB), botão
  amarelo = SOLO, vermelho = MUTE, azul = PREPARE (arma o canal — por
  enquanto só indicação visual, ainda não filtra o que entra na
  gravação; funcionalidade completa fica como próximo passo, avisado
  com honestidade em vez de fingir que já filtra)
- 4 botões de transporte: BACK, PLAY, REC, NEXT
- Testado via simulação de mensagens MIDI (sem hardware físico aqui pra
  testar de verdade) — mapeamento, troca de banco, solo/mute/trim e REC
  todos conferidos batendo certo

## [v1.9.0] — 2026-07-19

### REC — vídeo podia sair com um frame só, travado (achado com gravação real enviada)
- Analisando um arquivo real enviado (12s de áudio, mas o vídeo inteiro era
  a mesma imagem parada do início ao fim): o desenho da composição (o que
  vira o vídeo gravado) e os dados que ele mostra (timecode, medidores)
  dependiam só do requestAnimationFrame — que o navegador pode jogar quase
  a zero quando a aba fica minimizada/em segundo plano (comportamento
  documentado de todo navegador Chromium, pra economizar bateria/CPU em
  aba que não está sendo olhada). O áudio grava certo porque o
  AudioContext não para nunca por causa disso — só o vídeo travava
- Corrigido: enquanto REC está ativo, o timecode/medidores/composição
  também são atualizados por um processo preso direto ao grafo de áudio,
  que não é afetado por esse throttle de aba em segundo plano — garante o
  vídeo acompanhando mesmo se a janela for minimizada durante a gravação
- Importante ser honesto: não consegui reproduzir 100% o cenário exato de
  "aba minimizada" no ambiente de teste automatizado que uso aqui (é uma
  limitação do navegador headless de teste, não significa que não
  aconteça). A correção é baseada em como o Chrome documentadamente trata
  áudio x renderização em segundo plano, testei que não regride nada no
  uso normal, mas recomendo: evite minimizar/trocar de janela durante uma
  gravação até termos mais confirmação real do seu lado
- Dica prática enquanto isso: com máquina com pouca RAM rodando outras
  coisas pesadas junto (tipo KDE Connect), deixar a aba do Smart Khroma em
  primeiro plano e fechar o que não precisa durante a gravação reduz o
  risco de qualquer travamento, dessa causa ou de outras

## [v1.8.0] — 2026-07-19

### Realimentação (feedback) do mic — corrigido, bug real
- Reportado com microfone Zoom H1 USB: ao ligar e apertar PLAY (que também
  serve pra monitorar o mic ao vivo, sem arquivo carregado), o áudio do mic
  ia direto pro alto-falante — causando retorno/realimentação sempre que
  mic e caixa de som estão no mesmo ambiente (inclusive tablet, onde ficam
  a poucos centímetros um do outro)
- Corrigido: o retorno do mic pro alto-falante agora nasce SEMPRE mudo,
  em qualquer aparelho, todo POWER on. Preferência nunca fica salva de uma
  ligada pra outra — sempre precisa ligar de novo, de propósito
- Novo botão MON na barra de transporte (entre PLAY e POWER): liga/desliga
  esse retorno manualmente, só quando o usuário realmente quiser ouvir o
  mic pela caixa (ex: conferir sem fone). Sem afetar o VU/medidores — eles
  continuam funcionando com o mic mudo, é só o retorno de áudio que muda
- Reprodução de arquivo (PLAY com música carregada) não foi tocada — sempre
  tocou e continua tocando normalmente, o ajuste é só no caminho do mic

## [v1.7.0] — 2026-07-19

### SOLO — alvo de toque grande, de verdade
- SOLO/MUTE eram dois botõezinhos lado a lado, cada um com ~40% da já
  estreita coluna do canal — praticamente impossível de garantir o toque
  em equipamento tátil (mobile/tablet)
- Redesenhados: agora ocupam a largura inteira da coluna, empilhados —
  SOLO em cima (maior, ~60% da faixa) e MUTE embaixo. Cerca de 5x mais
  área de toque que antes. Hit-test do canvas atualizado junto, geometria
  idêntica ao desenho (sem risco de clique cair fora do botão desenhado)

### POWER — bug real encontrado e corrigido: primeiro toque "sumia"
- Investigando o toque do SOLO, encontrado um bug sério: ligar o
  equipamento também abria por engano o overlay de "solte o arquivo
  aqui" — um backdrop escuro cobrindo a tela inteira, capturando
  clique/toque em QUALQUER botão até ser dispensado uma vez. Como o
  overlay é escuro sobre o painel escuro, passava despercebido — parecia
  simplesmente que "o primeiro toque não funciona". Corrigido: ligar o
  equipamento não abre mais esse overlay (ele só aparece quando o usuário
  pede explicitamente, escolhendo carregar um arquivo)

## [v1.6.0] — 2026-07-19

### POWER — LED preso corrigido
- Ao desligar, o loop de desenho para de rodar (só mostra standby) e nunca
  mais atualizava a cor do botão — o LED do POWER ficava travado aceso.
  Força atualização na hora do clique agora

### Grave (LFE) solo — explicado e resolvido
- Roteamento/solo do LFE conferido tecnicamente: está correto, sinal chega
  saudável até o fim da cadeia dele. O motivo de "não vir" é que downmix
  5.1→estéreo padrão exclui o LFE de propósito (igual todo receiver real) —
  monitor comum nunca reproduz grave sub, só um subwoofer dedicado ouviria
- Adicionado: quando o LFE é solado, ele também toca nos dois canais só
  pra audição — assim dá pra conferir se tem conteúdo, mesmo em fone/caixa
  estéreo comum

### Neve — saiu do menu, voltou pro operável
- Ficava dentro da área com scroll do menu — girar a roda pra ajustar o
  drive rolava o menu inteiro junto, impossível de operar
- Agora fixo no painel de canais (Channel Levels), fora de qualquer área
  rolável — resolve o conflito e fica mais à mão, como pedido

### Visual
- Borda branca interna da tela removida — não existe isso em equipamento
  de verdade. Preto sangra quase até a borda; cinza só aparece mesmo
  embaixo, na faixa dos botões
- BACK/NEXT: só o símbolo agora — ícone+texto juntos ficava desalinhado
- Logo do STANDBY: centralizado de verdade no meio da tela (antes usava
  "regra dos terços", ficava puxado pra cima)

## [v1.5.0] — 2026-07-19

### Timecode — bug real de deriva corrigido
- `recSeconds` somava um valor fixo (1/60) por frame de tela, assumindo
  60fps constante. Quando o desenho pesado engasgava, o timecode atrasava
  junto — não era mais tempo real, virava "quantos frames eu consegui
  desenhar". Trocado pra seguir `audioCtx.currentTime` — relógio de
  hardware do áudio, imune a qualquer engasgo de renderização

### Performance — REC não pipoca mais ao longo de uma música inteira
- Composição de vídeo (a que vira o arquivo gravado) redesenhava a 60fps —
  o dobro do necessário, já que a captura roda a 30fps. Agora só redesenha
  em frames pares
- Goniômetro: 3 camadas de brilho × 512 pontos = 1536 operações por frame,
  o cálculo mais pesado da tela. Reduzido pra 2 camadas com amostragem
  esparsa (menos ainda durante REC) — mantém a aparência, corta ~4x o custo

### Rodapé reorganizado
- Ordem: IN primeiro → STUDER → RIDER → dBTP → MSTR por último
- DR removido — nunca teve dado real, só mostrava "— dB" fixo
- NEVE saiu da barra apertada, ganhou seção própria no menu (liga/desliga
  + drive), com espaço de verdade

### Cursor da timeline
- Linha um pouco mais grossa (2px → 3px) pra melhor leitura, sem tampar
  o resto — só ganhou destaque, continua sendo uma linha só

### Proteção incremental — regressão corrigida, limite real documentado
- `_startIncrSave` referenciava `this.recAudio`, variável que não existe
  mais desde a reescrita do REC pra MP4 — a proteção "a cada 3s" parou de
  funcionar silenciosamente, mas o mostrador continuava dizendo "● ON"
- Corrigido pra refletir a realidade: modo fallback (WebM/Safari) já tem
  chunks nativos a cada 250ms, sem depender desse mecanismo. Modo WebCodecs
  (caminho principal) ainda é tudo-ou-nada — arquivo só existe se REC for
  parado normalmente. Proteção incremental de verdade nesse modo exige
  trocar `ArrayBufferTarget` por `StreamTarget` no mp4-muxer — fica como
  próximo item, não escondido atrás de um mostrador enganoso

## [v1.4.1] — 2026-07-19

### Ajuste do chassi — feedback direto do Kaue
- Moldura reduzida de 26px pra ~7px — quase toda a tela é aproveitada agora
- Cor: de prata brilhante pra preto fosco quase escovado (mistura escura,
  só um traço sutil de metal na borda) — "uma tinta só de base", não chapa
- Corrige efeito colateral: o dial de loudness que ficava perto demais da
  borda voltou a ter espaço de sobra

## [v1.4.0] — 2026-07-19

### Visual — chassi prata (referência Blackmagic)
- Chassi trocado de cinza-escuro pra alumínio escovado, com parafusos
  decorativos no padrão da referência (topo + laterais)
- Moldura visível ao redor da tela (antes ia até a borda)
- Botões REC/PLAY/POWER continuam escuros — contraste sobre o prata

### VU — segmentos tipo LED
- Barras de nível trocadas de gradiente contínuo pra segmentos discretos
  (estilo LED de hardware de verdade), zonas de cor fixas: verde → amarelo
  (75%) → vermelho (90%) — igual ao medidor da referência

## [v1.3.0] — 2026-07-18

### Limitador de true peak (substitui o Rider antigo)
- O "Rider de Nível" ficava perseguindo um alvo de LUFS puxando o ganho de
  entrada pra cima e pra baixo — na prática um normalize contínuo. Prática
  de masterização em 2026 não faz isso: masteriza com headroom de pico e
  deixa cada plataforma (Spotify, YouTube, etc） normalizar sozinha na hora
  de tocar, sem processamento destrutivo
- Cada canal (L,R,C,LFE,Ls,Rs) agora tem seu próprio limitador de true peak
  no fim da cadeia (ratio 20:1, hard-knee, ataque de 1ms) — só derruba o
  que passaria do teto, nunca sobe nada. Teto ajustável via scroll no botão
  RIDER (-12 a 0 dBTP, padrão -1dBTP = streaming-safe)
- LUFS continua só como referência visual no mostrador, sem tocar em ganho

### Mobile — trava de orientação
- Equipamento profissional, roda travado em paisagem. Em celular na
  vertical, mostra aviso pra girar em vez de distorcer o layout
- Chassis já escalava proporcionalmente pra qualquer resolução — só faltava
  bloquear o retrato, que tinha sido desligado na sessão anterior (era
  "desktop only"); agora suporta mobile também, só que travado

### Visual
- Bordas de separação (menus, painéis, controles) de 2px → 1px — visual
  mais fino, hairline

## [v1.2.0] — 2026-07-18

### Gravação — reescrita completa
- REC agora entrega 1 arquivo só (antes disparava 2 downloads simultâneos —
  vídeo+áudio e um áudio avulso redundante — que o Chrome costuma bloquear)
- Formato mudou de WebM pra MP4 H.264+AAC via WebCodecs (roda no Mac, abre
  em QuickTime, arrasta em qualquer NLE incluindo DaVinci Resolve)
- Fallback em 3 camadas: WebCodecs (Chrome/Edge) → MediaRecorder MP4 nativo
  verificado por codec real avc1+mp4a (Safari) → WebM com aviso explícito
  na tela (nunca entrega um .mp4 que na verdade é VP9/Opus disfarçado)
- Corrigido: os 6 ScriptProcessors do WAV 6ch eram criados/destruídos a
  cada clique de REC — a reconexão ao vivo no grafo de áudio causava o
  estalo. Agora conectam uma única vez, na montagem do grafo 5.1

### Roteamento 5.1 — correção estrutural
- A gravação captava o sinal seco de entrada (this.gainNode), antes dos
  faders, Neve, SSL e Studer — nenhum ajuste no console chegava no arquivo
  gravado. Agora capta o sinal já processado (recTapStereo)
- C, LFE, Ls e Rs só alimentavam os medidores — nunca chegavam no que
  tocava nem no que gravava, só L/R. Cada canal agora tem sua própria
  cadeia Neve→SSL→Studer completa e discreta (DynamicsCompressorNode do
  Web Audio é limitado a 2 canais pela spec, por isso 6 cadeias mono em
  paralelo em vez de 1 cadeia estéreo só)
- REC/export usam downmix 5.1→2.0 padrão (LFE corretamente excluído do
  fold-down, como em qualquer downmix profissional); WAV 6ch sob demanda
  continua discreto de verdade

### Neve — drive controlável
- Antes só liga/desliga com curva fixa — sem forma de segurar antes de
  estourar. Agora scroll no botão ajusta o drive (-24 a +12dB)

### Outras correções
- mp4-muxer apontava pra versão 4.4.3, que nunca existiu no npm — export
  de áudio MP4 (menu separado) estava quebrado silenciosamente. Corrigido
  pra 4.3.3 (última versão real da 4.x)

## [v1.1.0] — 2026-07-13

### Performance — Motor de Áudio
- ScriptProcessors desacoplados: criados/destruídos só durante REC
- WaveShaper Neve oversample 4x → 2x
- fftSize 2048 → 1024 nos 9 analysers
- TruePeak e LUFS throttle: a cada 3 frames (~20fps)

### Freeze — UI
- _drawComposite() só renderiza durante REC
- Buffer reuse via WeakMap — elimina GC pressure
- _encodeWAV 3-5x mais rápido (Uint8Array direto)
- _stopAll() limpa todos os nós do grafo 5.1

### Service Worker
- CACHE_NAME: smart-khroma-v3
- skipWaiting() + clients.claim()
- React, ReactDOM e Babel cacheados offline via unpkg

### Ícones
- icon-192.png, icon-512.png, favicon-32.png, favicon-64.png incluídos

## [v1.0.0] — 2026-07-11

### Lançamento inicial
- Motor 5.1: L R C LFE Ls Rs
- VU meters, Phasescope, Spectrum, Loudness, Chromesthesia
- Gravação WebM + WAV 24-bit BWF/iXML
- Playlist, Batch record/normalize, Gamepad BGP-2016
- Auto-Level Rider, Timecode, 6 temas, PWA

## [v1.3.3] — gamepad remapeado
- PS (centro), segurar 1s → POWER (evita acidente)
- L2/R2 → seleciona canal (L,R,C,LFE,Ls,Rs)
- D-pad ↑/↓ → volume do canal selecionado
- Share → Menu
- Touchpad: sem função, livre e seguro
