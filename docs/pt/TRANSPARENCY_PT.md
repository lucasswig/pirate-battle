# Registro de Transparência de Engenharia e Pair-Programming Colaborativo — Pirate Battle (Versão em Português)

> **Para a equipe de Engenharia e Talentos da Jungle Gaming:**
> Este documento oferece visibilidade 100% autêntica e transparente sobre o desenvolvimento do desafio técnico **Pirate Battle**. Ele registra a dinâmica real de trabalho em **Pair-Programming colaborativo entre o desenvolvedor candidato (Junior Frontend Game Developer)** e um **Copiloto/Mentor Técnico de IA**.
> Longe de mascarar o uso de ferramentas modernas de IA, este registro detalha com total honestidade: o que o copiloto sugeriu, o que o desenvolvedor analisou, questionou, aprovou e ativamente corrigiu, demonstrando a base sólida, o pensamento crítico e a estrita fidelidade aos requisitos do produto por parte do candidato.

---

## 1. Metodologia de Engenharia Colaborativa

Em estúdios modernos de desenvolvimento de jogos, utilizar IA como acelerador só funciona de verdade quando o desenvolvedor que pilota a ferramenta possui fundamentos sólidos e senso crítico apurado. Um programador sem base aceita passivamente alucinações, código inchado e desvios de escopo. Ao longo deste desafio:
* **O Copiloto Técnico de IA** propôs blueprints de arquitetura, fórmulas físicas, cálculos vetoriais e configurações de boilerplate.
* **O Desenvolvedor (Candidato)** analisou minuciosamente cada proposta contra o [README.md](README.md) oficial, auditou o acabamento visual, identificou discrepâncias nas regras de produto, exigiu correções imediatas e validou que cada conceito foi plenamente compreendido antes de avançar.

---

## 2. Decisões Principais, Papéis e Responsabilidades

### Decisão 1: Motor PixiJS v8 Puro e Desacoplado vs. `@pixi/react`
* **Proposto pelo Copiloto:** Criar uma classe pura em TypeScript (`GameEngine`) contida em um único container React (`<GameView />`), sem intermediários como `@pixi/react`, para evitar sobrecarga de reconciliação a 60 FPS.
* **Ação do Desenvolvedor:** **Aprovada e apoiada.** O desenvolvedor compreendeu que amarrar o loop contínuo do WebGL ao estado do React causaria quedas bruscas de quadros (*jank*) e pausas frequentes do Garbage Collector. Validou o padrão de eventos discretos onde o React apenas escuta mudanças pontuais (pontuação, segundos do relógio, fim de jogo).

### Decisão 2: Simulação Independente de Taxa de Quadros via Delta Time ($\Delta t$) com Trava (*Clamping*)
* **Proposto pelo Copiloto:** Multiplicar todo o movimento por $\Delta t$ com um teto de segurança ($\Delta t_{\max} = 0.1\text{s}$) para evitar que navios atravessem paredes ao alternar abas no navegador (*tunneling*).
* **Ação do Desenvolvedor:** **Aprovada após aprofundamento.** O desenvolvedor questionou o que significava "clamping" matematicamente, exigiu uma explicação simples e clara, e após entender o conceito, validou a importância da trava de segurança para estabilidade física.

### Decisão 3: Reutilização de Projéteis (*Object Pooling*) — Zero Alocação de Memória
* **Proposto pelo Copiloto:** Implementar uma piscina de objetos em memória (`ProjectilePool`) com 120 projéteis pré-alocados para evitar alocações e desalocações contínuas durante salvas intensas de canhão.
* **Ação do Desenvolvedor:** **Aprovada e apoiada.** O candidato verificou que pré-alocar balas de canhão estabiliza o heap de memória do V8 e elimina travamentos por coleta de lixo (*stop-the-world GC pauses*) no meio do combate.

### Decisão 4: Eliminação da Marcha à Ré (Fidelidade Estrita ao README e Modelo Náutico a Vela)
* **Proposto pelo Copiloto (Falha inicial):** O copiloto implementou inicialmente um controle padrão de jogos de corrida/arcade que permitia ao navio dar ré com a tecla `S` ou `Seta para Baixo`.
* **Ação do Desenvolvedor:** **QUESTIONADA E CORRIGIDA PELO DESENVOLVEDOR.** O candidato inspecionou atentamente a Seção 2.1.1 do [README.md](README.md) (*"Movimentação para a frente e rotação para os dois lados"*) e cobrou o copiloto: navios a vela históricos não possuem motor com engrenagem de ré. O desenvolvedor ordenou a remoção imediata da marcha à ré, impondo navegação a vela realista (avançar com panos cheios, virar para bombordo/boreste e parar por atrito com a água ao recolher velas).

### Decisão 5: Direção de Arte e Uso Fiel dos Assets Oficiais
* **Proposto pelo Copiloto (Falha inicial):** O copiloto começou com um protótipo funcional em *graybox*, desenhando ilhas com círculos verdes simplificados para validar primeiro a física de colisão.
* **Ação do Desenvolvedor:** **QUESTIONADA E CORRIGIDA PELO DESENVOLVEDOR.** O candidato inspecionou o [sample.png](assets/sample.png) oficial e a pasta `public/assets/`, exigindo que o jogo não parecesse "feio" nem genérico, determinando o uso imediato dos tilesets e spritesheets oficiais (praias recortadas com água rasa translúcida em degradê, fortalezas de pedra com torres e canhões, rastros de fumaça atrás das balas e velas temáticas com caveira e brasões).

### Decisão 6: Resiliência de Rede, Fila Local no LocalStorage e Mocks no MSW v2
* **Proposto pelo Copiloto:** Utilizar Mock Service Worker (MSW v2) na camada de rede com Axios, TanStack Query e uma fila no `localStorage` para envio de partidas com identificador único (`matchId`).
* **Ação do Desenvolvedor:** **Aprovada e apoiada.** O desenvolvedor validou a importância de proteger a pontuação do jogador contra quedas de Wi-Fi ou recarregamento acidental de página.

### Decisão 7: Coreografia Náutica de Naufrágio, Carcaça Submarina e Náufragos na Praia
* **Proposto pelo Copiloto (Falha inicial):** Ao zerar a vida de um navio inimigo, o copiloto pretendia apenas disparar uma explosão rápida e remover imediatamente a entidade da cena.
* **Ação do Desenvolvedor:** **QUESTIONADA E ENRIQUECIDA PELO DESENVOLVEDOR.** O candidato exigiu uma coreografia de combate convincente:
  1. O navio atingido converte sua colisão imediatamente para evitar bloqueios fantasmas no jogador.
  2. A embarcação é convertida em carcaça submarina (*wreck*) renderizada abaixo dos navios vivos e com chamas atrás das velas.
  3. Tripulantes sobreviventes saltam como nadadores e botes/canoas, nadam em direção ao ponto de areia mais próximo da ilha, desembarcam e permanecem na praia sem desaparecer.
  4. A onda de proa (*bow wave push*) do navio do jogador empurra os náufragos lateralmente na água sem aplicar dano, travando-os fora do interior sólido da ilha.

### Decisão 8: Idempotência Estrita no Registro de Partidas e Leaderboard
* **Proposto pelo Copiloto (Falha inicial):** Gerar IDs aleatórios diretamente no handler do MSW a cada requisição POST recebida.
* **Ação do Desenvolvedor:** **CORRIGIDA PELO DESENVOLVEDOR.** O candidato apontou uma violação direta do edital: se o jogador clicar duas vezes rapidamente ou se houver um reenvio após timeout de rede, a partida seria duplicada no histórico e no ranking. O desenvolvedor impôs a geração do `matchId` determinístico pelo cliente no momento exato em que o combate termina, reutilizando-o em retentativas. No MSW, ordenou que requisições com o mesmo `matchId` retornem `status 200 OK` com o registro existente, prevenindo qualquer duplicidade.

### Decisão 9: Paginação Real na Camada de Rede vs. Corte Local (`.slice()`) no React
* **Proposto pelo Copiloto (Falha inicial):** Retornar todo o array de ranking e histórico pela API do MSW e deixar o componente React paginar com `slice((page-1)*5, page*5)`.
* **Ação do Desenvolvedor:** **QUESTIONADA E CORRIGIDA PELO DESENVOLVEDOR.** O desenvolvedor notou que isso desrespeitava a exigência de "contratos tipados para consulta paginada" e não simulava uma API real de produção. Exigiu que a paginação ocorresse no MSW com query parameters `?page=1&pageSize=5`, retornando metadados estruturados (`totalPages`, `totalItems`), integrando ao TanStack Query com `placeholderData` para navegação suave sem solavancos visuais.

### Decisão 10: Gaveta Interativa de Simulação de Cenários de Rede para a Banca
* **Proposto pelo Copiloto:** Simular cenários de rede apenas alterando variáveis no código ou via mocks estáticos de teste.
* **Ação do Desenvolvedor:** **EXIGÊNCIA DE ALTO NÍVEL DO DESENVOLVEDOR.** O candidato antecipou a experiência do avaliador técnico e exigiu a criação de um componente visual (`NetworkScenarioDrawer`): uma gaveta acessível no canto da tela com 10 cenários de rede (sucesso padrão, listas vazias, lentidão de 2s, jitter de respostas fora de ordem, erros 500, timeout 504, timeout pós-registro e modo offline) com botão de reset para restaurar fixtures em um clique.

### Decisão 11: Critério Determinístico de Desempate e Comparação por Configuração
* **Proposto pelo Copiloto:** Ordenar o ranking de jogadores apenas por `score DESC`.
* **Ação do Desenvolvedor:** **APROVADA COM REFINAMENTO PELO DESENVOLVEDOR.** O candidato pontuou que pontuações iguais geravam empates visuais na mesma posição e que misturar partidas de 90s com 120s era injusto. Exigiu filtro por duração de batalha e desempate em cascata: `Pontos (DESC)` → `Acurácia (DESC)` → `Menor Tempo (ASC)` → `Data mais antiga (ASC)` → `ID alfabético (ASC)`.

### Decisão 12: Visibilidade de Partidas Pendentes e Sincronização Sob Demanda
* **Proposto pelo Copiloto:** Apenas enfileirar partidas offline no `localStorage` e sincronizar silenciosamente no background.
* **Ação do Desenvolvedor:** **EXIGÊNCIA DE PRODUTO DO DESENVOLVEDOR.** O jogador que joga sem conexão precisa de feedback imediato de que seu progresso foi salvo localmente. O desenvolvedor ordenou a mescla dos registros offline diretamente na visualização do histórico, marcando-os com badge visual `PENDING` e disponibilizando um botão manual `Sync X Pending` para reenvio explícito além do evento `online`.

### Decisão 13: Acessibilidade Semântica, Focus Traps e Live Regions
* **Proposto pelo Copiloto:** Depender do contorno de foco padrão do navegador sem personalização visual ou live regions.
* **Ação do Desenvolvedor:** **EXIGÊNCIA DE ACESSIBILIDADE E QUALIDADE SÊNIOR.** O candidato impôs conformidade estrita com as diretrizes WAI-ARIA: anéis dourados de alto contraste (`focus-visible:ring-4 focus-visible:ring-amber-400`) para navegação por teclado, hook especializado `useFocusTrap` mantendo o foco restrito aos modais (Pausa, Resultado e Gaveta MSW) com fechamento via tecla `Escape`, e uma região `aria-live="polite"` semântica comunicando avarias críticas no casco, abates inimigos e pausas para leitores de tela.

### Decisão 14: Telemetria de 60 FPS, Benchmarks Automatizados e Descarte de Partida Abandonada
* **Proposto pelo Copiloto:** Validar performance apenas por percepção visual subjetiva.
* **Ação do Desenvolvedor:** **EXIGÊNCIA DE RIGOR TÉCNICO E MÉTRICAS REAIS.** O desenvolvedor ordenou a implementação de telemetria no motor (`GameEngine.getPerformanceMetrics()`) com amostragem contínua de delta times para cálculo do p95 de latência de frame. Criou testes automatizados via Playwright comprovando 140+ FPS, estabilidade de memória em 5 ciclos consecutivos de jogo/desmonte sem acúmulo de instâncias e validação formal de descarte estrito de partidas abandonadas via "Return to Menu" (zero chamadas espúrias à API).

### Decisão 15: A Jornada do Cenário em Tiles — Do Desafio Matemático ao Tiled Map Editor e aos 2 Temas
* **Contexto Real e Primeira Experiência:** Esta foi a primeira experiência do desenvolvedor com tilemaps 2D em grade. No início do projeto, tentou utilizar IA para calcular as matrizes e posições dos tiles programaticamente, mas matematicamente era excessivamente complexo encaixar perfeitamente as quinas de terra, curvas de praia e transições de água rasa sem gerar costuras visuais quebradas.
* **Pesquisa e Domínio de Ferramentas da Indústria:** Após algumas boas horas de estudo e testes contínuos, pesquisou conteúdos especializados e conheceu um canal internacional no YouTube demonstrando o uso do **Tiled Map Editor**. Compreendeu que montar cenários manualmente no Tiled permitia o controle visual absoluto sobre camadas de relevo (*water, edge, ground, props*).
* **Descoberta dos Assets Oficiais do Kenney e `pixi-tiledmap`:** Ao testar os primeiros recortes, notou que os tiles originais não se alinhavam com perfeição. Foi então que descobriu o pacote original do **[Kenney Pirate Pack](https://kenney.nl/assets/pirate-pack)**, onde os tiles de 64×64px se encaixavam com precisão milimétrica. Para integrar a exportação `.tmj` diretamente ao ecossistema do PixiJS sem reimplementar um parser proprietário, pesquisou e adotou a biblioteca open-source **[`pixi-tiledmap`](https://github.com/riebel/pixi-tiledmap)**.
* **Por que Existem 2 Temas nas Opções:** Essa descoberta permitiu arquitetar o jogo de forma modular: a matriz lógica do mapa (`tilemap.tmj`) foi desacoplada da textura visual. Por isso, a tela de Opções oferece a alternância entre **Modern** (tema azul-petróleo) e **Classic** (tema azul-claro tropical), demonstrando que o mesmo cenário pode renderizar múltiplos pacotes de arte de forma dinâmica e limpa.

### Decisão 16: Higienização Profunda do Repositório, Descarte de 32MB de Bloat e Build Limpo
* **Proposto pelo Copiloto:** Manter arquivos legados em `public/assets` e deixar capturas de tela do Playwright na raiz de `public/`.
* **Ação do Desenvolvedor:** **EXIGÊNCIA DE ARQUITETURA LIMPA E BUILD ENXUTO.** O desenvolvedor ordenou a auditoria completa do projeto para remover arquivos mortos que inflavam o pacote final:
  - Excluiu `public/tiles_sheet.tsx` (XML antigo com extensão que confundia o compilador TypeScript/React).
  - Eliminou `.swf` (Flash) e SVGs brutos da pasta `vector/` (3.16 MB) e mockups estáticos `sample*.png` (~9 MB).
  - Eliminou sprites 2x redundantes em `retina/` (3.95 MB) e tilesheets legados descontinuados (2.1 MB).
  - Identificou que os testes do Playwright estavam poluindo `public/` com 22 imagens (~11.3 MB) que o Vite copiava para `dist/` a cada build. Redirecionou todas as saídas para `test-results/screenshots/`.
  - O resultado foi um build de produção (`dist/`) ultraleve, pesando menos da metade do tamanho original, com 0 avisos e 100% dos 32 testes passando.

---

## 3. Matriz de Decisões e Responsabilidades

| Categoria | Decisão | Proposta Por | Papel e Ação do Desenvolvedor | Status |
| :--- | :--- | :---: | :--- | :---: |
| **Arquitetura** | PixiJS v8 desacoplado dentro do React | Copiloto | **Aprovada** — Validou a separação de responsabilidades sem perda de FPS | **Concluída** |
| **Cenário / Tiles**| **Uso do Tiled (`.tmj`), Kenney Pack e 2 Temas**| **Desenvolvedor**| **Investigou e Implementou na Raça** — Aprendeu Tiled, integrou `pixi-tiledmap` e criou os 2 temas | **Concluída** |
| **Limpeza / Build** | **Higienização de 32MB de bloat e build limpo** | **Desenvolvedor**| **Exigiu Limpeza Sênior** — Eliminou Flash, mockups e isolou prints em `test-results/` | **Concluída** |
| **Física** | Delta Time ($\Delta t$) com trava de 100ms | Copiloto | **Aprovada** — Questionou o termo, aprendeu a mecânica e validou | **Concluída** |
| **Memória** | Object Pooling para 120 projéteis | Copiloto | **Aprovada** — Apoiou a estabilidade do heap a 60 FPS sem pausas de GC | **Concluída** |
| **Produto / Escopo**| **Remoção da marcha à ré (Navegação pura a vela)** | **Desenvolvedor**| **Corrigiu o Copiloto** — Impôs cumprimento estrito da Seção 2 do README | **Concluída** |
| **Arte / Visual** | **Recriação visual fiel ao `sample.png`** | **Desenvolvedor**| **Exigiu Refinamento** — Impôs o uso dos tiles e sprites oficiais | **Concluída** |
| **Gameplay / Efeitos** | **Coreografia de naufrágio com carcaças e náufragos** | **Desenvolvedor**| **Cobrou Profundidade** — Carcaças, marinheiros a nado e botes na areia | **Concluída** |
| **Rede / Idempotência** | **Prevenção de duplicatas com `matchId` determinístico** | **Desenvolvedor**| **Identificou Risco** — Reenvios e retries retornam registro existente sem duplicar | **Concluída** |
| **API / Contratos** | **Paginação real no MSW vs. slice no React** | **Desenvolvedor**| **Corrigiu Arquitetura** — Impôs `?page` e `?pageSize` no MSW e TanStack Query | **Concluída** |
| **Ferramenta / UX** | **Gaveta visual de cenários de rede para a banca** | **Desenvolvedor**| **Projetou Solução** — Criou interface para alternar 10 cenários e resetar dados | **Concluída** |
| **Negócio / Regras** | **Desempate determinístico em cascata por configuração** | **Desenvolvedor**| **Refinou Algoritmo** — Desempate por acurácia, tempo, data e id | **Concluída** |
| **Resiliência / Fila** | **Visibilidade de partidas pendentes no histórico** | **Desenvolvedor**| **Aprimorou UX** — Badges `PENDING` e botão manual `Sync Pending` | **Concluída** |
| **Acessibilidade / A11y**| **Focus trap em modais, anéis dourados e live regions** | **Desenvolvedor**| **Exigiu Conformidade** — WAI-ARIA com live announcer de combate e hook de foco | **Concluída** |
| **Performance / QA** | **Telemetria de frame time p95 e teste de memória** | **Desenvolvedor**| **Impôs Métricas** — Benchmark automatizado a 140+ FPS e 5 ciclos sem leaks | **Concluída** |

---

## 4. Por que Essa Postura Faz a Diferença na Jungle Gaming

1. **Liderança Ativa em vez de Aceitação Cega:** Qualquer pessoa pode pedir para uma IA gerar código genérico. O desenvolvedor demonstrou a capacidade de **supervisionar, criticar, identificar violações de especificação e exigir correções**, atuando como um engenheiro que realmente se importa com o produto.
2. **Humildade e Sede de Domínio dos Fundamentos:** Sempre que um termo técnico ou fórmula foi proposto (clamping, projeção na normal, object pooling, idempotência de API), o candidato fez questão de entender a fundo o *como* e o *porquê* antes de aceitar.
3. **Capricho e Obsessão por Detalhes:** O candidato recusou entregas secas ou atalhos fáceis (como paginar no client ou apenas deletar o navio ao ser abatido), elevando o padrão de acabamento visual, físico e de resiliência de rede para nível de produção.
4. **Pensamento Orientado à Demonstração e Avaliação:** A criação proativa da Gaveta de Cenários MSW prova maturidade profissional — não basta fazer funcionar na sua máquina, é preciso facilitar a validação de quem vai auditar o projeto.
