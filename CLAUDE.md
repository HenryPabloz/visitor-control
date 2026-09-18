# CLAUDE.md - visitor-control

## Uso de subagentes (skill /subagent-driven-development)

- Sempre que o usuário disser para "usar agentes", use a skill `/subagent-driven-development` (adaptada: sem worktree/ledger completo quando o pedido não exigir — dispatch de subagentes paralelos com arquivos disjuntos, revisão e teste feitos por mim ao final).
- Antes de delegar, analise a quantidade de tarefas pedidas na mensagem:
  - **2 ou mais tarefas** → delegue para agentes. Cada agente recebe **somente o contexto necessário para a tarefa dele** (não cole o histórico da conversa nem tarefas de outros agentes no prompt).
  - **Apenas 1 tarefa** → implemente você mesmo, sem delegar.
- Nunca delegue o entendimento do problema: diagnostique/planeje a solução antes de escrever o prompt de cada agente, e valide o resultado (build + teste real) depois que os agentes terminarem.
