# Pirate Battle — Shooter Naval 2D com Visão Superior

> **Publicação (Deploy):** [Deploy Pendente / Cloudflare Pages]  
> **Documentação:** [English Version (../../README.md)](../../README.md) | [Arquitetura (ARCHITECTURE_PT.md)](ARCHITECTURE_PT.md) | [Relatório de Profiling (../profiling/PROFILING_PT.md)](../profiling/PROFILING_PT.md) | [Registro de Decisões (TRANSPARENCY_PT.md)](TRANSPARENCY_PT.md) | [Matriz de Requisitos (../requirements/REQUIREMENTS_PT.md)](../requirements/REQUIREMENTS_PT.md)

Simulador de combate naval 2D em tempo real desenvolvido com **React 19**, **PixiJS v8**, **TypeScript (Modo Estrito)**, **TanStack Query v5**, **Axios**, **MSW v2**, com validação por uma suíte completa de **34 testes automatizados E2E e de regressão visual com Playwright**.

---

## 1. Execução a partir de um Checkout Limpo

O projeto possui **zero dependências privadas** ou serviços pagos externos. Qualquer avaliador pode clonar o repositório e executar toda a solução localmente com Node.js padrão (v18+ ou v20+ recomendados):

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor local de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` em qualquer navegador moderno desktop ou mobile.

### Comandos npm Disponíveis

| Comando | Finalidade |
| :--- | :--- |
| `npm run dev` | Inicia o servidor Vite em `http://localhost:3000` com MSW ativo |
| `npm run build` | Compila TypeScript e gera os bundles otimizados para produção |
| `npm run preview` | Serve o build de produção localmente em `http://localhost:3000` |
| `npm run typecheck` | Executa a checagem estrita de tipos TypeScript (`tsc --noEmit`) |
| `npm run test:e2e` | Executa os 34 testes automatizados do Playwright em Chromium |
| `npm run test:report` | Abre o relatório interativo em HTML pré-gerado do Playwright |
| `npm run test:profile` | Executa o benchmark automatizado de 60 FPS e estabilidade de memória em 5 ciclos |

---

## 2. Controles de Jogo

A simulação física suporta **navegação contínua, curvas e disparos de canhão simultâneos** tanto no teclado quanto no toque em dispositivos móveis:

| Ação | Teclado Desktop | Controle Touch Mobile |
| :--- | :---: | :---: |
| **Acelerar para Frente** | `W` ou `Seta para Cima` | Botão Superior do D-Pad / Joystick |
| **Girar para Bombordo (Esquerda)** | `A` ou `Seta para a Esquerda` | Botão Esquerdo do D-Pad / Joystick |
| **Girar para Estibordo (Direita)** | `D` ou `Seta para a Direita` | Botão Direito do D-Pad / Joystick |
| **Canhão Frontal (1 Projétil)** | `Espaço` | Botão Vermelho de Bala Frontal |
| **Salva de Bombordo (3 Projéteis Esquerda)** | `Q` | Botão Azul de Canhão Duplo (Esquerda) |
| **Salva de Estibordo (3 Projéteis Direita)** | `E` | Botão Azul de Canhão Duplo (Direita) |
| **Pausar / Retomar Partida** | `Escape` | Botão de Pausa Superior Direito (`II`) |
| **Alternar Tela Cheia** | Botão em tela | Tela cheia nativa ou modal de auxílio para iOS Safari |

---

## 3. Arquitetura e Mecânicas de Gameplay

### Física Realista de Vela e Água
- **Momento e Inércia:** O navio acelera gradualmente até a velocidade limite e desacelera com atrito viscoso realista; ré bloqueada conforme especificação.
- **Esteiras Náuticas:** Navegar em velocidade gera esteiras duplas de espuma dinâmica na popa do casco.
- **Balística de Artilharia:** Balas de canhão percorrem vetores normais com trilhas de fumaça e tempos de recarga individuais (Frontal: 0,45s; Laterais: 1,2s).

### Comportamento dos Inimigos (IA)
- **Chaser (`EnemyChaser`):** Persegue ativamente as coordenadas do jogador, causa 35 de dano por impacto ao colidir e explode sem pontuar.
- **Shooter (`EnemyShooter`):** Mantém distância estratégica (~320px), alinha a proa com o jogador e dispara balas periodicamente com recarga de 1,8s.

### Coreografia de Destruição e Náufragos
- Navios destruídos convertem-se em destroços afundados com fumaça e chamas.
- Tripulantes sobreviventes (nadadores e botes) navegam até a praia de areia mais próxima usando projeção tangencial e ancoram em segurança na costa.
- Ondas de proa de navios em movimento empurram náufragos lateralmente sem causar dano ou atravessar o interior sólido das ilhas.

---

## 4. Configurações de Partida (Tela Options)

A tela **Options** permite balancear a partida com salvamento automático no `localStorage`:

- **Tempo de Partida:** Configurável de **60 a 180 segundos** (Padrão: 90s).
- **Intervalo de Surgimento de Inimigos:** Configurável de **2,0 a 10,0 segundos** (Padrão: 3,5s).
- **Tema Visual do Arquipélago:** Alternância instantânea entre **Asset Pack 1 (Trópicos)** e **Asset Pack 2 (Atóis)**.

---

## 5. Simulação de Cenários de Rede com MSW

A gaveta retrátil **"Network Scenarios"** no menu principal permite simular e validar falhas de rede em tempo real:

| Cenário | Comportamento | Resposta do Sistema |
| :--- | :--- | :--- |
| **Sucesso (Padrão)** | Respostas HTTP 200 imediatas | Carregamento fluído de ranking e histórico |
| **Lentidão** | Atraso simulado de 2000ms | Exibe skeletons de carregamento sem travar a interface |
| **Lista Vazia** | Retorna HTTP 200 com 0 registros | Exibe cartões visuais de estado vazio |
| **Falha de Rede (500)** | Retorna HTTP 500 | Dispara políticas de retry e mensagens de erro acessíveis |
| **Resiliência Offline** | Simula desconexão ao final da partida | Enfileira partida no `localStorage`; permite iniciar outra partida |
| **Restaurar Estado** | Restaura fixtures iniciais e limpa a fila | Retorna ao estado inicial para novos testes |

---

## 6. Relatórios de Testes e Profiling

Todos os relatórios de avaliação estão incluídos e versionados no repositório:

- **Relatório de Testes Playwright:** Localizado em `reports/playwright-report/index.html`. Execute `npm run test:report` para abrir o painel interativo com os 34 testes aprovados.
- **Resultados de Testes em JSON:** Localizado em `reports/test-results.json`.
- **Relatório de Profiling e Memória:** Detalhado em [../profiling/PROFILING_PT.md](../profiling/PROFILING_PT.md) e [../profiling/PROFILING.md](../profiling/PROFILING.md), com medições reais do V8 Heap em 5 ciclos e telemetria de $p_{95}$.
- **Dados Brutos de Telemetria:** Salvos em `reports/profiling-data.json`.

---

## 7. Acessibilidade (WAI-ARIA)

- **Navegação por Teclado:** Suporte completo a Tab, Shift+Tab e setas direcionais em todos os elementos com anéis dourados de foco (`focus-visible:ring-4 focus-visible:ring-amber-400`).
- **Focus Trap:** Ativo nos modais de Pausa, Resultado e na Gaveta de Rede pelo hook `useFocusTrap`.
- **Leitores de Tela:** Regiões semânticas com `aria-live="polite"` transmitem eventos essenciais da partida sem saturação sonora.
