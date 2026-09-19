# Relatório de Profiling de Performance e Memória

Este documento apresenta as medições empíricas de performance e estabilidade de memória do **Pirate Battle**, conforme exigido pelas Seções 9 e 11 dos critérios de avaliação.

---

## 1. Ambiente de Referência dos Testes

| Parâmetro | Especificação |
| :--- | :--- |
| **Sistema Operacional** | Windows 10 Pro (x64) |
| **Navegador / Runtime** | Chromium 153.0.8010.12 (Headless / Shell Automatizado) |
| **Fabricante da GPU** | Google Inc. (NVIDIA) |
| **Renderizador WebGL** | `ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11)` |
| **Resolução de Exibição** | 1280 × 720 (DPR: 1.0) / Simulação da Arena em 1920 × 1080 |
| **Alvo de Simulação** | 60 FPS (orçamento de 16,67 ms por frame) |
| **Arquivo de Telemetria Bruta** | `reports/profiling-data.json` |

---

## 2. Telemetria de Combate (FPS e Tempo entre Frames)

Durante uma sessão de combate naval intenso envolvendo manobras simultâneas do jogador, disparos frontais, disparos laterais em salva (6 balas paralelas por salva), perseguição de Chaser e Shooter com IA de navegação e esteiras náuticas dinâmicas, os seguintes dados foram registrados via buffer deslizante de 300 quadros:

| Métrica | Alvo / Orçamento | Resultado Medido | Status |
| :--- | :---: | :---: | :---: |
| **Taxa de Quadros Sustentada** | $\ge$ 60 FPS | **143 – 145 FPS** | **APROVADO** (Supera em 2.4× o alvo) |
| **Tempo Médio de Frame** | $\le$ 16,67 ms | **6,94 ms** | **APROVADO** (58% abaixo do orçamento) |
| **Percentil 95 ($p_{95}$)** | $\le$ 33,33 ms | **7,00 ms** | **APROVADO** (Consistência absoluta) |
| **Entidades Ativas em Tela** | Múltiplas | 1 Jogador, 1–2 Inimigos, 8+ Projéteis | **APROVADO** (Zero micro-travamento) |
| **Engasgos / Quedas de Frame** | 0 | 0 quadros descartados | **APROVADO** |

### Decisões Arquiteturais para o $p_{95}$ de 7ms
- **Object Pooling Zero-GC:** Projéteis, clarões de canhão e esteiras d'água não executam `new Object()` nem geram closures no loop de renderização. Todos são reciclados via `ProjectilePool`.
- **Renderização em Lote (Batching) no PixiJS v8:** Os ladrilhos do oceano, cascos, mastros e velas compartilham texturas de atlas unificados (`ui_sheet.json`, `tiles_sheet.json`). As chamadas de desenho (draw calls) são agrupadas na GPU.
- **Simulação com Delta-Time Amortecido:** O loop de física utiliza `dt = Math.min(ticker.deltaMS / 1000, 0.1)`, impedindo saltos bruscos ou espirais de tempo em caso de atraso de escalonamento do sistema operacional.

---

## 3. Estabilidade de Memória e Análise de Vazamentos (5 Ciclos)

A Seção 9 exige verificar o consumo de memória ao longo de **cinco ciclos consecutivos de iniciar partida, combater e sair**, investigando se há acúmulo contínuo de recursos.

A telemetria do V8 Heap do Chromium (`performance.memory.usedJSHeapSize`) foi registrada na tela inicial e após o encerramento de cada ciclo:

| Fase do Ciclo | Memória JS Heap (MB) | Variação ($\Delta$) | Diagnóstico |
| :--- | :---: | :---: | :--- |
| **Ciclo 0 (Menu Inicial Ocioso)** | 15,90 MB | Referência | Aplicação carregada com MSW ativo |
| **Ciclo 1 (Combate $\rightarrow$ Destruição $\rightarrow$ Menu)** | 23,07 MB | +7,17 MB | Carga inicial de texturas e shaders |
| **Ciclo 2 (Combate $\rightarrow$ Destruição $\rightarrow$ Menu)** | 24,15 MB | +1,08 MB | Cache de atlas estabilizado |
| **Ciclo 3 (Combate $\rightarrow$ Destruição $\rightarrow$ Menu)** | 25,55 MB | +1,40 MB | Teto operacional atingido |
| **Ciclo 4 (Combate $\rightarrow$ Destruição $\rightarrow$ Menu)** | 23,93 MB | **-1,62 MB** | Garbage Collector do V8 reciclou memória |
| **Ciclo 5 (Combate $\rightarrow$ Destruição $\rightarrow$ Menu)** | 24,35 MB | +0,42 MB | **Platô estabilizado em ~24 MB** |

### Verificação do Processo de Desmontagem (Teardown)
Ao retornar ao menu ou reiniciar uma partida:
1. O método `GameEngine.destroy()` paralisa imediatamente o Ticker do PixiJS (`app.ticker.stop()`).
2. Todos os event listeners registrados em `window` (`keydown`, `keyup`, `resize`, `blur`, `focus`) são removidos.
3. Loops sonoros de ambiente e água são interrompidos via Web Audio API.
4. A árvore de nós da cena é destruída via `stage.destroy({ children: true, texture: false })`.
5. As texturas em `AssetManager` são mantidas em memória para evitar recargas lentas de GPU na rodada seguinte.
6. A referência global `__gameEngine` é atribuída a `undefined`, permitindo a coleta imediata de entidades transitórias pelo Garbage Collector.

---

## 4. Limitações Observadas e Recomendações

1. **Aceleração Gráfica por Hardware:** Em máquinas virtuais sem placa de vídeo dedicada (ex.: renderizadores por software como SwiftShader), o PixiJS opera em fallback WebGL/Canvas2D com taxas entre 40 e 55 FPS.
2. **Políticas de Autoplay de Áudio:** Navegadores modernos (Chrome, Safari) bloqueiam o áudio Web Audio até a primeira interação do usuário. O motor suspende o contexto de áudio na inicialização e o reativa sincronamente no primeiro clique (`Play` ou `Options`).

---

## 5. Script para Reprodução do Benchmark

Para reproduzir este teste e atualizar os dados brutos em `reports/profiling-data.json`:

```bash
npm run test:profile
```

Para rodar toda a suíte de 34 testes com geração do relatório HTML interativo:

```bash
npm run test:e2e
npm run test:report
```
