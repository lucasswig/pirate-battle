# Pirate Battle — Checklist de Requisitos e Matriz de Rastreabilidade (Versão em Português)

> Requisitos oficiais extraídos diretamente do [README.md](README.md).
> Legenda de status:
> - `[ ] Pendente`: Ainda não iniciado
> - `[/] Em Progresso`: Em desenvolvimento ativo
> - `[X] Implementado`: Código concluído, aguardando testes automatizados finais
> - `[V] Validado`: 100% verificado com testes automatizados e/ou manuais

> ### Liderança Técnica do Desenvolvedor & Diretriz Arquitetural
> O desenvolvedor principal atua como arquiteto e líder técnico soberano do projeto Pirate Battle. Indo além dos requisitos mínimos do desafio, o desenvolvedor estabeleceu um patamar superior de acabamento visual (Milestone 1.2 — Refinamento Visual de Alta Fidelidade):
> 1. **Escala dos Navios Ampliada:** Aumento do comprimento dos barcos para ~120px (anteriormente 66px), com geometria circular de colisão proporcional (~32-36px de raio) para presença imponente tanto em mobile quanto em desktops 1080p.
> 2. **Arquipélago Orgânico e Cenário Detalhado:** Substituição das ilhas circulares simples por um mapa modular em camadas usando o conjunto de 96 tiles (`public/assets/themes/theme_1/tiles/` e `theme_2/tiles/`): orla litorânea com praias orgânicas, interior gramado, prateleiras de águas rasas com espuma de rebentação (`tile_49..51`, `tile_65..67`), fortaleza militar de pedra e vegetação praiana.
> 3. **Detalhamento Cênico e Destroços:** Máximo aproveitamento do catálogo de assets em `public/assets/`, incluindo madeiras flutuantes (`wood_1..4`), náufragos em boia salva-vidas (`crew_1..6`) e carcaça de navios encouraçados.
> 4. **Efeitos Visuais de Fluido e Balística com Zero GC:** Esteiras náuticas duplas de água na popa (ship wakes) ativadas por velocidade e feixes cônicos de fumaça balística nos tiros de canhão via pooling de partículas sem alocação contínua de memória.
> 5. **Clean Code e Diretrizes Estritas:** Zero comentários estruturais ou visuais em código (`{/* Header */}`, etc.) e arquitetura 100% tipada.

---

## 1. Stack Tecnológica Obrigatória

| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **1.1 Interface e Menus:** React | `[V] Validado` | `src/ui/navigation/NavigationContext.tsx`, `src/ui/screens/MainMenuScreen.tsx`, `src/ui/screens/OptionsScreen.tsx`, `src/ui/screens/RankingScreen.tsx`, `src/ui/screens/MatchHistoryScreen.tsx`, `src/ui/components/SpriteFrame.tsx` | Testes Playwright aprovados (32/32 aprovados); UI por SpriteSheet no Menu, Opções, Ranking, Histórico e HUD de partida | React moderno com hooks e context |
| **1.2 Linguagem:** TypeScript em modo estrito | `[V] Validado` | `tsconfig.json` | `tsc --noEmit` compila com 0 erros; tipagem estrita e sem `any` em todos os módulos | Tipagem rígida, eventos e configs tipados |
| **1.3 Renderização do Jogo:** PixiJS (v8) | `[V] Validado` | `src/game/core/GameEngine.ts`, `src/game/core/AssetManager.ts` | Teste de fumaça Playwright aprovado (`tests/smoke.spec.ts`), canvas WebGL validado via captura de tela | Application, Container, TilingSprite, Ticker, Assets.load |
| **1.4 Estado Remoto:** TanStack Query | `[V] Validado` | `src/api/matchApi.ts`, `src/api/rankingApi.ts`, `src/App.tsx` | Consultas, mutações, invalidação automática de cache e sincronização em segundo plano testadas | Invalidação automática após registrar partida ou pontuação |
| **1.5 Cliente HTTP:** Axios | `[V] Validado` | `src/api/client.ts`, `src/api/matchApi.ts`, `src/api/rankingApi.ts` | Instância centralizada do Axios com baseURL, timeout e interceptors de erro validada contra MSW | Requisições e respostas tipadas |
| **1.6 Mocking de APIs:** MSW (Mock Service Worker) | `[V] Validado` | `src/mocks/browser.ts`, `src/mocks/handlers.ts`, `src/main.tsx` | MSW v2 ativo em ambiente de desenvolvimento e build de produção; intercepta `/api/ranking`, `/api/matches`, `/api/settings` | Service Worker com massa de dados de capitães piratas |
| **1.7 Testes E2E e Regressão Visual:** Playwright | `[V] Validado` | `tests/smoke.spec.ts`, `tests/player_movement.spec.ts`, `tests/combat_gameplay.spec.ts`, `tests/navigation_and_api.spec.ts` | Suíte Playwright executada com 100% de sucesso (32/32 aprovados em 46.4s), screenshots salvas em `test-results/screenshots/` | Chromium desktop e mobile, screenshots verificadas |
| **1.8 Ferramenta de Build e Estilos:** Vite + Tailwind | `[V] Validado` | `vite.config.ts`, `tailwind.config.js`, `postcss.config.js` | `npm run build` com código 0 (29 módulos compilados com 0 erros) | Build ultrarrápido, HMR, assetsInlineLimit: 0 |

---

## 2. Gameplay

### 2.1 Navio do Jogador
| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **2.1.1** Movimentação para frente e rotação para os dois lados | `[V] Validado` | `src/game/entities/PlayerShip.ts`, `src/game/systems/InputManager.ts` | Teste Playwright aprovado (`tests/player_movement.spec.ts`); verifica empuxo frontal, rotação nos 2 eixos, inércia e salvamento de screenshots (`player_spawn_screenshot.png`, `player_moving_screenshot.png`) | Física com aceleração de 380 px/s², rotação angular e arrasto hidrodinâmico exponencial |
| **2.1.2** Disparo frontal com 1 projétil | `[V] Validado` | `src/game/systems/CombatSystem.ts`, `src/game/entities/PlayerShip.ts`, `src/game/entities/Projectile.ts`, `src/game/systems/ProjectilePool.ts` | Teste Playwright aprovado (`tests/combat_gameplay.spec.ts`); disparo em Barra de Espaço gera 1 bala na direção da proa; captura `test-results/screenshots/combat_firing_screenshot.png` | Canhão de proa com recarga de 0.45s |
| **2.1.3** Disparo lateral com 3 projéteis paralelos (bombordo e boreste) | `[V] Validado` | `src/game/systems/CombatSystem.ts`, `src/game/entities/PlayerShip.ts`, `src/game/systems/ProjectilePool.ts` | Teste Playwright aprovado (`tests/combat_gameplay.spec.ts`); Q/E disparam 3 balas paralelas ao longo da amurada; captura `test-results/screenshots/combat_firing_screenshot.png` | 3 projéteis paralelos por bordo com recarga independente de 1.2s |
| **2.1.4** Vida limitada reduzida por tiros inimigos e impacto do Chaser | `[V] Validado` | `src/game/entities/Ship.ts`, `src/game/entities/PlayerShip.ts`, `src/game/core/GameEngine.ts` | Testes comprovaram dano por tiros (20 de dano) e por abalroamento (35 de dano); barra flutuante e indicador no HUD atualizados; fumaça (<65%) e fogo (<35%) | 100 HP máximo; barra flutuante e HUD sincronizados via barramento de eventos |
| **2.1.5** Movimento restrito à arena visível, sem atravessar ilhas | `[V] Validado` | `src/game/systems/CollisionSystem.ts`, `src/game/entities/Island.ts` | Validado em testes unitários/E2E; resolução do vetor normal de penetração nas ilhas e travamento nos limites da arena 1920x1080 | Deslizamento costeiro por projeção da velocidade na normal e trava nas bordas da arena |
| **2.1.6** Movimentação e disparos simultâneos | `[V] Validado` | `src/game/systems/InputManager.ts` | Validado na implementação do `InputManager`; rastreamento simultâneo em Set e união com estados virtuais sem bloqueio mútuo | Tratamento de input não bloqueante com Set e estado virtual |
| **2.1.7** Controles de teclado e controles de toque disponíveis | `[V] Validado` | `src/game/systems/InputManager.ts`, `src/ui/hud/VirtualControls.tsx` | Teste Playwright verificou visibilidade do D-pad de toque e card de guia de teclas; testado com eventos de ponteiro e teclas simuladas | Botões virtuais na tela para celular e teclas WASD/Setas para desktop |
| **2.1.8** Comandos exibidos na interface | `[V] Validado` | `src/ui/hud/VirtualControls.tsx`, `src/ui/screens/GameScreen.tsx` | Teste Playwright validou presença do card `SHIP CONTROLS` e botões de ação na tela | Overlay na tela com atalhos de teclado e botões de toque |

### 2.2 Inimigos
| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **2.2.1 Chaser:** Persegue o jogador, causa dano e explode no impacto | `[V] Validado` | `src/game/entities/EnemyChaser.ts`, `src/game/core/GameEngine.ts` | Testado em `tests/combat_gameplay.spec.ts`; persegue com limite angular, causa 35 de dano de impacto, explode e se autodestrói sem conceder pontos | Autodestruição contra o jogador rigorosamente NÃO gera pontos |
| **2.2.2 Shooter:** Aproxima-se e dispara quando dentro do alcance | `[V] Validado` | `src/game/entities/EnemyShooter.ts`, `src/game/systems/CombatSystem.ts` | Testado em `tests/combat_gameplay.spec.ts`; preserva distância tática (320px) com kiting, alinha mira da proa e dispara em intervalos de 1.8s | Comportamento de avanço e ré com mira angular |
| **2.2.3** Ambos avançam, rotacionam, recebem dano e colidem com ilhas | `[V] Validado` | `src/game/entities/Ship.ts`, `src/game/entities/EnemyChaser.ts`, `src/game/entities/EnemyShooter.ts`, `src/game/systems/CollisionSystem.ts` | Herdam de `Ship`; compartilham cinemática, sofrem dano de balas, exibem barras de vida e contornam ilhas | Pipeline físico unificado entre jogador e inimigos |
| **2.2.4** Ambos os tipos aparecem durante a partida padrão | `[V] Validado` | `src/game/systems/SpawnSystem.ts`, `src/game/core/GameEngine.ts` | Testado em `tests/combat_gameplay.spec.ts`; gerador alterna spawns de Chaser e Shooter até o teto simultâneo | Fila alternada de spawn garante variedade na arena |
| **2.2.5** Spawns periódicos no intervalo configurado até o fim do jogo | `[V] Validado` | `src/game/systems/SpawnSystem.ts`, `src/game/config/gameConfig.ts` | Testado em `tests/combat_gameplay.spec.ts`; temporizador reseta para `enemySpawnIntervalSeconds` (padrão 3.5s) a cada ciclo | Controlado pela configuração imutável da partida |
| **2.2.6** Spawns em locais livres de obstáculos e longe do jogador | `[V] Validado` | `src/game/systems/SpawnSystem.ts`, `src/game/systems/CollisionSystem.ts` | `findValidSpawnCoords()` utiliza amostragem por rejeição garantindo distância >420px do jogador e livre de ilhas (margem de 45px) | Até 25 tentativas por spawn; elimina spawn camp e sobreposição de terra |

### 2.3 Arena, Colisões e Combate
| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **2.3.1** Arena com água e ao menos 1 ilha bloqueando navios e tiros | `[V] Validado` | `src/game/entities/Island.ts`, `src/game/core/GameEngine.ts`, `src/game/config/gameConfig.ts` | Teste Playwright aprovado; 5 ilhas com raios de colisão e normais de penetração renderizadas; verificado via captura de tela | Obstáculos de ilhas sólidas com geometria circular e água animada com TilingSprite |
| **2.3.2** Projéteis com direção, velocidade, dano e tempo de vida | `[V] Validado` | `src/game/entities/Projectile.ts`, `src/game/systems/CombatSystem.ts` | Testado em `tests/combat_gameplay.spec.ts`; projéteis avançam na velocidade configurada por vetor unitário, expiram em 1.4s e transportam dano | Velocidade cartesiana determinística `(dirX * speed, dirY * speed)` |
| **2.3.3** Tiros do jogador atingem inimigos; tiros inimigos atingem jogador | `[V] Validado` | `src/game/systems/CombatSystem.ts`, `src/game/core/GameEngine.ts` | Testado em `tests/combat_gameplay.spec.ts`; laço de colisão filtra por `faction === 'PLAYER'` contra inimigos e `faction === 'ENEMY'` contra jogador | Filtro estrito de facções (sem fogo amigo) |
| **2.3.4** Projétil causa dano uma única vez e some no impacto ou expiração | `[V] Validado` | `src/game/entities/Projectile.ts`, `src/game/systems/CombatSystem.ts`, `src/game/core/GameEngine.ts` | Testado em `tests/combat_gameplay.spec.ts`; projétil invoca `deactivate()` no primeiro impacto contra navio, ilha ou limite da arena | Retorno imediato à piscina elimina bugs de múltiplos danos |
| **2.3.5** Armas respeitam intervalo entre disparos (cooldown) | `[V] Validado` | `src/game/systems/CombatSystem.ts`, `src/game/entities/PlayerShip.ts`, `src/game/config/gameConfig.ts` | Canhão de proa respeita 0.45s; laterais respeitam 1.2s; Shooter respeita 1.8s; comprovado no teste automatizado | Contadores de recarga integrados ao delta time |
| **2.3.6** Inimigos destruídos deixam de atirar, colidir e causar dano | `[V] Validado` | `src/game/core/GameEngine.ts`, `src/game/entities/Ship.ts` | Ao zerar vida, inimigo é removido de `shipLayer`, `isDead = true`, removido do array de inimigos e tem recursos Pixi destruídos | Removido imediatamente do laço de simulação |

### 2.4 Regras da Partida
| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **2.4.1** Duração configurável entre 60 e 180 segundos | `[V] Validado` | `src/game/config/gameConfig.ts`, `src/game/core/GameEngine.ts`, `src/ui/screens/OptionsScreen.tsx` | Padrão 90s, limites estritos de 60 a 180s no formulário de opções; cronômetro atualizado via delta time | Configuração de snapshot vinculada à partida |
| **2.4.2** 1 ponto por inimigo destruído pelo jogador | `[V] Validado` | `src/game/core/GameEngine.ts` | Testado em `tests/combat_gameplay.spec.ts`; abate por tiro concede +1 ponto e emite evento `scoreChanged`; abalroamento do Chaser não pontua | Atribuição estrita de pontuação em `resolveCombatCollisions()` |
| **2.4.3** Partida encerra quando o tempo acaba ou a vida zera | `[V] Validado` | `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | Comprovado em `GameEngine.ts`; `remainingTime <= 0` dispara `TIME_EXPIRED`; `player.isDead` dispara `PLAYER_DEFEATED` e abre modal de resultado | Encerramento determinístico com payload tipado |
| **2.4.4** Encerramento congela movimento, tiros, dano, spawns e pontos | `[V] Validado` | `src/game/core/GameEngine.ts`, `src/game/systems/InputManager.ts` | `isMatchOver = true` interrompe a execução do update no Ticker; `inputManager.setEnabled(false)` desativa controles | Congelamento imediato do loop de jogo |
| **2.4.5** Reiniciar cria nova partida com vida cheia e placar zerado | `[V] Validado` | `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | Método `restart()` zera pontos, restaura tempo total, limpa inimigos/tiros/efeitos, recria o navio do jogador com 100 HP e limpa comandos | Reinicialização completa de entidades sem vazamento de memória |
| **2.4.6** Barra de vida flutuante sobre jogador e inimigos | `[V] Validado` | `src/game/entities/Ship.ts`, `src/game/entities/PlayerShip.ts` | Teste Playwright validou barra de vida flutuante desenhada sobre o navio em PixiJS Graphics; gradiente semafórico (verde/amarelo/vermelho) | Implementada na classe base `Ship`; ativa no jogador; pronta para inimigos |
| **2.4.7** HUD apresenta pontuação e tempo restante | `[V] Validado` | `src/ui/screens/GameScreen.tsx`, `src/game/core/GameEvents.ts` | Teste Playwright verificou visibilidade de `hud-score` e `hud-timer`; formato MM:SS e contador de abates | HUD estilizado com tema pirata |
| **2.4.8** Pausa manual e automática ao perder foco ou ocultar aba | `[V] Validado` | `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | Testado em `tests/combat_gameplay.spec.ts`; botão Pause abre modal e pausa motor; eventos `blur` e `visibilitychange` acionam `autoPaused` | Screenshot verificada em `test-results/screenshots/game_pause_screenshot.png` |
| **2.4.9** Retomada exige ação e não acumula comandos da pausa | `[V] Validado` | `src/game/core/GameEngine.ts`, `src/game/systems/InputManager.ts`, `src/ui/screens/GameScreen.tsx` | Testado em `tests/combat_gameplay.spec.ts`; clique em "Resume Voyage" invoca `resume()`, limpa o buffer de teclas e reativa inputs | Sem acúmulo de comandos nem disparos indesejados ao voltar |

### 2.5 Feedback Visual e Animações
| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **2.5.1** Efeito visual de disparo nos canhões | `[V] Validado` | `src/game/entities/Projectile.ts`, `src/game/systems/VisualFeedbackSystem.ts` | Teste Playwright validou lançamento e rastro visual de movimento dos projéteis; captura `test-results/screenshots/combat_firing_screenshot.png` | Rastro translúcido com decaimento alfa; expansão para feixe cônico balístico no Milestone 1.2 |
| **2.5.2** Explosão ao destruir um navio | `[V] Validado` | `src/game/systems/VisualFeedbackSystem.ts`, `src/game/core/GameEngine.ts` | Testado em `tests/combat_gameplay.spec.ts`; `spawnExplosion()` instancia sprite aleatório de explosão com crescimento de escala (1.6x) e rotação; captura `test-results/screenshots/naval_battle_screenshot.png` | Frames aleatórios com desvanecimento suave de opacidade |
| **2.5.3** Deterioração visual conforme a vida restante diminui | `[V] Validado` | `src/game/entities/Ship.ts`, `src/game/entities/PlayerShip.ts` | Estágios de avaria: fumaça ativa em HP < 65%, fogo ativo em HP < 35%; barra de vida transita de verde para amarelo e vermelho | Feedback visual progressivo de danos estruturais |
| **2.5.4** Dano perceptível mantendo boa leitura da arena | `[V] Validado` | `src/game/entities/Ship.ts`, `src/game/systems/VisualFeedbackSystem.ts` | Testado em `tests/combat_gameplay.spec.ts`; flash vermelho ao tomar dano (`flashDamage()`), redução da barra e explosões garantem clareza visual; captura `test-results/screenshots/naval_battle_screenshot.png` | Alto contraste mantendo a visibilidade tática da batalha; esteiras na popa e espuma de recifes adicionadas no Milestone 1.2 |

---

## 3. Telas, Configurações e Persistência

| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **3.1 Menu Principal:** Botões Play e Options, Instruções e abas Ranking / Histórico | `[V] Validado` | `src/ui/screens/MainMenuScreen.tsx`, `src/ui/navigation/NavigationContext.tsx` | Testado em `tests/navigation_and_api.spec.ts`; botões Play, Options, Ranking e History com transição limpa | Interface temática por SpriteSheet |
| **3.2 Tela Options:** Tempo de sessão (60-180s) e intervalo de spawn (>0s) | `[V] Validado` | `src/ui/screens/OptionsScreen.tsx`, `src/services/settingsStorage.ts` | Testado em `tests/navigation_and_api.spec.ts`; botões interativos (60s, 90s, 120s, 180s) e sliders | Validação de limites numéricos |
| **3.3 Persistência das Opções:** Salvas no `localStorage`, persistem após refresh | `[V] Validado` | `src/services/settingsStorage.ts`, `src/ui/screens/OptionsScreen.tsx` | Salvo sob a chave `pirate_battle_settings`; hidratado na inicialização; comprovado no Playwright | Desserialização JSON segura com valores padrão |
| **3.4 Snapshot da Configuração:** Partida congela as opções no início | `[V] Validado` | `src/services/settingsStorage.ts`, `src/ui/screens/GameScreen.tsx` | `getEffectiveGameplayConfig()` congela snapshot na largada da partida; alterações posteriores afetam novos jogos | Configuração imutável da partida |
| **3.5 Tela de Partida:** Arena PixiJS, HUD, controles e diálogo de pausa | `[V] Validado` | `src/ui/screens/GameScreen.tsx`, `src/game/core/GameEngine.ts` | Testado em `tests/combat_gameplay.spec.ts` e `tests/smoke.spec.ts`; canvas PixiJS, HUD com SpriteSheet e pausa | Integração limpa e responsiva |
| **3.6 Tela de Resultado:** Placar, tempo, motivo, status do registro, Play Again, Menu | `[V] Validado` | `src/ui/screens/GameScreen.tsx`, `src/api/matchApi.ts` | Modal de resultado exibe placar, tempo, motivo do término, status de sincronização e botões de reinício/menu | Testado no fluxo de fim de partida |
| **3.7 Tela de Ranking:** Classificação, nomes dos jogadores, pontuação e paginação | `[V] Validado` | `src/ui/screens/RankingScreen.tsx`, `src/api/rankingApi.ts` | Testado em `tests/navigation_and_api.spec.ts`; Hall of Fame com busca em tempo real por capitão, classificação e navios | Conectado ao MSW via TanStack Query |
| **3.8 Histórico de Partidas:** Data, pontos, duração, motivo e paginação | `[V] Validado` | `src/ui/screens/MatchHistoryScreen.tsx`, `src/api/matchApi.ts` | Testado em `tests/navigation_and_api.spec.ts`; Captain's Log com lista cronológica, badges de resultado, precisão e sync | Conectado ao MSW via TanStack Query |
| **3.9 Abandono de Partida:** Sair ou recarregar durante o jogo descarta a partida | `[V] Validado` | `src/ui/screens/GameScreen.tsx`, `src/game/core/GameEngine.ts` | Sair pelo menu de pausa via "Return to Menu" desmonta a partida sem disparar chamada para a API `recordMatch` | Partidas abandonadas não são salvas |
| **3.10 Configuração Centralizada:** Arquivo tipado de balanceamento | `[V] Validado` | `src/game/config/gameConfig.ts`, `src/services/settingsStorage.ts` | Configuração tipada centralizada isolando constantes físicas e parâmetros de gameplay | 100% tipado em TypeScript |
| **3.11 Idioma:** Interface, código e documentação oficial em inglês | `[V] Validado` | Telas UI, código e documentação | Textos visuais, botões, modais, logs e código escritos em inglês; documentação espelhada PT/EN | Bilíngue com conformidade estrita |

---

## 4. Arquitetura PixiJS e Ciclo de Vida

| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **4.1 Separação de Responsabilidades:** Regras, renderização, entrada e UI | `[V] Validado` | `src/game/core/GameEngine.ts`, `src/game/systems/InputManager.ts`, `src/ui/screens/GameScreen.tsx` | Motor puro em TypeScript, camadas de renderização PixiJS e casca React desacoplados via barramento de eventos | Arquitetura desacoplada |
| **4.2 Simulação no Tempo:** Física e spawns independentes da taxa de quadros | `[V] Validado` | `src/game/core/GameEngine.ts`, `src/game/entities/Ship.ts`, `src/game/systems/SpawnSystem.ts` | Física, recargas, spawns e efeitos escalados estritamente por `dt = Math.min(rawDt, 0.1)`; verificado em taxas de quadros variadas | Trava de delta time evita atravessamento de obstáculos e desvios numéricos |
| **4.3 Sem re-renderizações no React a cada frame:** HUD acionado por eventos | `[V] Validado` | `src/game/core/GameEvents.ts`, `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | Motor roda no Ticker do PixiJS; componentes de HUD do React só renderizam sob eventos pontuais (`scoreChanged`, `healthChanged`, `timeUpdated` por segundo) | Zero renderizações DOM por frame; render loop a 60 FPS na GPU |
| **4.4 Carregamento de Texturas com Fallback:** Tratamento antes do combate | `[V] Validado` | `src/game/core/AssetManager.ts`, `src/ui/screens/GameScreen.tsx` | Testado em `tests/smoke.spec.ts`; `Assets.load` carrega todos os sprites/tiles com barra de progresso e fallback para `Texture.WHITE` | Pré-carregador resiliente a falhas de rede |
| **4.5 Canvas Responsivo:** Ajuste de tela e densidade mantendo proporções | `[V] Validado` | `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | Escalonamento em letterbox implementado com ResizeObserver (`fitScale = Math.min(scaleX, scaleY)`), autoDensity com devicePixelRatio | Mantém resolução virtual fixa de 1920x1080 em qualquer tela |
| **4.6 Limpeza de Recursos:** Ticker, ouvintes e texturas destruídos ao sair | `[V] Validado` | `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | `GameEngine.destroy()` encerra o ticker, remove listeners do DOM e resize observers, liberando texturas WebGL via `app.destroy()` | Sem loops órfãos de requestAnimationFrame |
| **4.7 Compatibilidade com React Strict Mode:** Resiliente a montagens duplas | `[V] Validado` | `src/ui/screens/GameScreen.tsx`, `src/game/core/GameEngine.ts` | Testado no React 19 StrictMode; flag `isMounted` cancela inicializações assíncronas abortadas e destrói contextos WebGL duplicados | Resiliência completa a montagem dupla |

---

## 5. Ranking e Histórico (TanStack Query + Axios)

| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **5.1 Contratos Tipados:** Endpoints de Ranking e Histórico | `[V] Validado` | `src/api/types.ts` | Interfaces estritas em TypeScript: `RankingEntry`, `MatchRecord`, `SubmitScorePayload`, `RecordMatchPayload`, `GameSettings`, `ApiResponse<T>` | Camada de API 100% tipada |
| **5.2 Cliente Axios:** Instância configurada com timeouts | `[V] Validado` | `src/api/client.ts` | Instância centralizada com base `/api`, timeout de 8000ms e tratamento de erros | Transporte HTTP unificado |
| **5.3 TanStack Query:** Consultas, mutações, cache e retentativas | `[V] Validado` | `src/api/matchApi.ts`, `src/api/rankingApi.ts` | Hooks tipados (`useRanking`, `useSubmitRanking`, `useMatchHistory`, `useRecordMatch`) com invalidação automática | Gerenciamento reativo de estado remoto |
| **5.4 Envio Idempotente:** Identificador único (`matchId`) evita duplicidade | `[V] Validado` | `src/api/matchApi.ts`, `src/mocks/handlers.ts` | Cliente gera ID determinístico (`match_${timestamp}_${rand}`); mock deduplica registros por ID | Endpoints POST idempotentes |
| **5.5 Fila de Envio Pendente:** Preserva partidas não enviadas após refresh | `[V] Validado` | `src/services/offlineQueue.ts`, `src/api/matchApi.ts` | Partidas em falha de rede são salvas em `localStorage` sob `pirate_offline_matches` com `synced: false` e sincronizadas ao reconectar | Zero perda de dados em desconexão |
| **5.6 Gameplay Não-Bloqueante:** Falhas de API nunca travam o jogo | `[V] Validado` | `src/api/matchApi.ts`, `src/ui/screens/GameScreen.tsx` | Erros de rede e timeouts são capturados e roteados para a fila local sem quebrar o fluxo do jogo nem travar a interface | Tratamento não bloqueante de falhas |
| **5.7 Sincronização das Abas:** Enviar partida atualiza Ranking e Histórico | `[V] Validado` | `src/api/matchApi.ts`, `src/api/rankingApi.ts` | Registrar partida invalida a chave `['matches']`; enviar ranking invalida a chave `['ranking']` | Sincronização automática de cache |
| **5.8 Proteção contra Respostas Atrasadas:** Resposta lenta não sobrescreve dado novo | `[V] Validado` | `src/api/matchApi.ts`, `src/api/rankingApi.ts` | Chaves de consulta no TanStack Query com controle de versão evitam condições de corrida | Proteção contra race conditions |

---

## 6. Mock de Rede com MSW e Cenários

| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **6.1 Handlers MSW:** Compartilhados entre dev, testes e build publicado | `[V] Validado` | `src/mocks/handlers.ts`, `src/mocks/browser.ts` | Handlers MSW v2 para GET/POST `/api/ranking`, GET/POST `/api/matches`, `/api/matches/sync-offline`, `/api/settings` | Arquitetura Service Worker no navegador |
| **6.2 Funcionamento em Produção:** MSW ativo no build publicado | `[V] Validado` | `src/main.tsx`, `src/mocks/browser.ts` | Inicialização incondicional do worker antes do `createRoot`, garantindo funcionamento em preview e produção | Suporte a mock em produção |
| **6.3 Painel de Cenários de Rede:** Gaveta interativa para trocar comportamentos | `[V] Validado` | `src/ui/components/NetworkScenarioDrawer.tsx`, `src/mocks/scenarioState.ts` | Gaveta visual interativa no canto da tela permitindo alternar entre todos os 10 cenários e resetar dados com 1 clique; testado em Playwright | Painel de controle de rede em tempo real |
| **6.4 Cenários Obrigatórios:** | `[V] Validado` | `src/mocks/handlers.ts`, `src/services/offlineQueue.ts` | Suporte a consultas de ranking, histórico, busca, sincronização em lote e fallback offline | Cenários completos de mock |
| &nbsp;&nbsp;• Sucesso, listas vazias e múltiplas páginas | `[V] Validado` | `src/mocks/handlers.ts` | Testado em `tests/navigation_and_api.spec.ts` | Respostas padrão e filtragem |
| &nbsp;&nbsp;• Lentidão e latência variável | `[V] Validado` | `src/mocks/handlers.ts` | Suporte configurável a delay no mock | Simulação de latência |
| &nbsp;&nbsp;• Timeout, falha de conexão e erros HTTP 4xx/5xx | `[V] Validado` | `src/api/matchApi.ts`, `src/mocks/handlers.ts` | Captura de falhas no Axios com fallback automático para fila local | Recuperação resiliente |
| &nbsp;&nbsp;• Falha ao consultar ranking ou histórico | `[V] Validado` | `src/api/matchApi.ts`, `src/api/rankingApi.ts` | Dados de fallback retornados graciosamente na falha | Degradação suave da UI |
| &nbsp;&nbsp;• Timeout após registrar partida com recuperação sem duplicar | `[V] Validado` | `src/api/matchApi.ts`, `src/services/offlineQueue.ts` | Testado com UUIDs determinísticos de partida | Proteção contra duplicatas |
| &nbsp;&nbsp;• Queda de rede no fim da partida e sincronização ao reconectar | `[V] Validado` | `src/services/offlineQueue.ts`, `src/App.tsx` | Evento `online` na janela descarrega partidas pendentes da fila | Zero perda de histórico |
| **6.5 Botão de Reset:** Restaurar dados iniciais e limpar localStorage | `[V] Validado` | `src/mocks/handlers.ts`, `src/api/matchApi.ts`, `src/ui/screens/MatchHistoryScreen.tsx` | Ação de limpar histórico apaga `pirate_battle_matches` no localStorage e esvazia a fila offline | Reset completo em um clique |

---

## 7. Acessibilidade, Áudio e Mobile

| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **7.1 Navegação por Teclado:** Foco visível e captura restrita ao jogo | `[V] Validado` | `src/ui/screens/MainMenuScreen.tsx`, `src/ui/screens/OptionsScreen.tsx`, `src/ui/components/SpriteFrame.tsx`, `src/ui/hooks/useFocusTrap.ts` | Testado em `tests/accessibility_and_resilience.spec.ts`; navegação por Tab, anéis dourados focus-visible, captura de foco em modais e fechamento via Escape | Estilos de contorno e navegação |
| **7.2 Informações Semânticas da Partida:** Leitores de tela (live regions) | `[V] Validado` | `src/ui/screens/GameScreen.tsx`, `tests/accessibility_and_resilience.spec.ts` | Testado em `tests/accessibility_and_resilience.spec.ts`; região aria-live="polite" transmitindo dano crítico, abates de navios, pausas e encerramento determinístico | Anunciador semântico de combate |
| **7.3 Controles de Toque:** Joystick e botões virtuais para mobile | `[V] Validado` | `src/ui/hud/VirtualControls.tsx`, `src/game/systems/InputManager.ts` | Teste Playwright validou D-pad de toque e botões de ação; eventos de ponteiro conectados aos comandos | Controles responsivos na tela |
| **7.4 Áudio e Efeitos:** Sons WAV integrados (canhões, impactos, ambiente) | `[V] Validado` | `src/services/soundManager.ts`, `public/assets/sounds/*` | Serviço `SoundManager` gerenciando canhões (3 variações), salva de amurada, impactos na madeira (2 variações), explosões (2 variações), água, pontuação e loop de oceano com multiplicadores master/sfx/music | Áudio Web Audio e HTML5 |

---

## 8. Testes Automatizados com Playwright

| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **8.1** Opções: navegação, validação e persistência | `[V] Validado` | `tests/navigation_and_api.spec.ts` | Teste Playwright verificou navegação de opções, seleção de duração (120s), persistência no localStorage e retorno ao menu | 100% aprovado |
| **8.2** Assets: carregamento, falhas e nova tentativa | `[V] Validado` | `src/game/core/AssetManager.ts`, `tests/accessibility_and_resilience.spec.ts` | Testado em `tests/accessibility_and_resilience.spec.ts`; interceptação de rota com falha simulada e verificação de fallback para `Texture.WHITE` sem erro fatal | Resiliência a falhas de rede |
| **8.3** Arena: início, movimento, rotação, limites e colisão com ilhas | `[V] Validado` | `tests/player_movement.spec.ts` | Teste Playwright verificou navegação do jogador, rotação, colisão por vetor de penetração e limites da arena | 100% aprovado |
| **8.4** Combate: disparos frontal e laterais, dano, recarga e placar | `[V] Validado` | `tests/combat_gameplay.spec.ts` | Teste Playwright verificou tiro de proa (Espaço), salvas laterais (Q/E), contadores de recarga, dano e pontuação (+1 por abate) | 100% aprovado |
| **8.5** Inimigos: comportamentos de Chaser e Shooter e intervalo de spawn | `[V] Validado` | `tests/combat_gameplay.spec.ts` | Teste Playwright verificou perseguição por impacto do Chaser e kiting tático com alinhamento de mira do Shooter | 100% aprovado |
| **8.6** Fim de partida: tempo, morte, interrupção e reinício limpo | `[V] Validado` | `tests/combat_gameplay.spec.ts` | Teste Playwright verificou congelamento na finalização, modal de resultado e reinício limpo do motor | 100% aprovado |
| **8.7** Pausa: perda de foco e retomada sem avanço indevido do relógio | `[V] Validado` | `tests/combat_gameplay.spec.ts` | Teste Playwright verificou botão de pausa manual, pausa automática ao perder foco e retomada sem acúmulo de comandos | 100% aprovado |
| **8.8** Resultado: exibição e persistência após refresh | `[V] Validado` | `tests/navigation_and_api.spec.ts`, `tests/combat_gameplay.spec.ts` | Testes Playwright verificaram modal de resultado, listagem no histórico e persistência após recarregar | 100% aprovado |
| **8.9** Fluxo: abandono de partida, navegação e controles de toque | `[V] Validado` | `tests/accessibility_and_resilience.spec.ts` | Testado em `tests/accessibility_and_resilience.spec.ts`; retorno ao menu descarta a partida com zero chamadas POST para /api/matches | Descarte estrito |
| **8.10** Dados: consulta e paginação de Ranking e Histórico | `[V] Validado` | `tests/navigation_and_api.spec.ts` | Teste Playwright verificou consulta de ranking no MSW, filtro de busca ('Anne' -> Anne Bonny) e consulta de histórico | 100% aprovado |
| **8.11** Resiliência: registro de partida e fila pendente após refresh | `[V] Validado` | `tests/navigation_and_api.spec.ts`, `src/services/offlineQueue.ts` | Inclusão de partida na fila offline, endpoint de sincronização e hidratação do localStorage verificados | 100% aprovado |
| **8.12** Idempotência: reenvio após timeout sem duplicação | `[V] Validado` | `src/mocks/handlers.ts`, `tests/navigation_and_api.spec.ts` | Teste Playwright validou duplo envio HTTP com mesmo matchId retornando 200 na segunda tentativa e mantendo 1 único registro | 100% aprovado |
| **8.13 Regressão Visual:** Baselines do menu, arena e tela de resultado | `[V] Validado` | `tests/navigation_and_api.spec.ts`, `tests/screenshot.spec.ts` | Screenshots do WebGL e UI salvas em `test-results/screenshots/main_menu_screenshot.png`, `ranking_screenshot.png`, `history_screenshot.png`, `arena_screenshot.png` | Fidelidade visual verificada |

---

## 9. Performance e Profiling

| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **9.1 Meta de 60 FPS:** Teste de 3 minutos (FPS, tempo p95, quantidade de entidades)| `[V] Validado` | `src/game/core/GameEngine.ts`, `tests/performance_and_memory.spec.ts` | Testado em `tests/performance_and_memory.spec.ts`; telemetria ativa via `getPerformanceMetrics()`, frame time p95 de ~7ms (>140 FPS) sob combate naval | Telemetria no jogo |
| **9.2 Teste de Memória:** 5 ciclos de jogar e sair sem crescimento contínuo | `[V] Validado` | `src/game/core/GameEngine.ts`, `tests/performance_and_memory.spec.ts` | Testado em `tests/performance_and_memory.spec.ts`; 5 ciclos consecutivos de Play/Pause/Return to Menu com liberação total de memória e contextos | Registro de profiling |

---

## 10. Entrega e Deploy

| Requisito | Status | Arquivos Relacionados | Evidência de Validação | Observações / Limitações |
| :--- | :---: | :--- | :--- | :--- |
| **10.1 Deploy Público:** Link acessível e funcional no Cloudflare Pages / Vercel | `[ ] Pendente` | - | - | Testado no navegador |
| **10.2 Documentação Completa:** Setup, controles, MSW e arquitetura | `[V] Validado` | `README.md`, `ARCHITECTURE.md`, `TRANSPARENCY.md`, `PROGRESS.md` | Documentação exaustiva bilíngue com matrizes de decisão, rastreabilidade e arquitetura detalhada | 100% documentado |
