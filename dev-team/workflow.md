# Colaboração e fluxo de trabalho

## Carregamento
Ler `dev-team/shared.md` e o perfil ativo antes de trabalhar. Jarvis também lê os perfis que envolverá. Em kit ainda não instalado, esses arquivos estão em `core/`. Buscar o contexto na raiz do projeto e respeitar instruções locais. Não presumir que arquivos de referência são carregados automaticamente: abrir os relevantes.

## Formas de operação
**Delegação real:** Jarvis usa ferramentas disponíveis e autorizadas para delegar a especialistas, fornece contexto e recebe resultados. Cada papel continua sujeito às permissões do ambiente. Revisão independente deve ser feita em contexto separado.

**Papéis em sequência:** um assistente aplica as perspectivas necessárias. Informar que a revisão foi pelo mesmo assistente. Arquivos Markdown não criam processos, comunicação automática ou memória compartilhada sozinhos.

**Troca manual:** o usuário muda o agente na interface; o anterior entrega um resumo com objetivo, estado, contratos, decisões, arquivos e próximo passo. Botões de handoff são sugestões de transição, não prova de execução automática.

## Fluxo proporcional
1. Jarvis entende objetivo e resultado esperado; Jared organiza quando necessário; Marco ajuda a definir critérios de aceitação e cenários de risco.
2. Richard investiga o projeto e as fontes oficiais, propõe ou confirma solução. Envolve Gilfoyle antes de decisões com risco e Jared em mudanças de escopo.
3. Richard implementa e verifica por partes coerentes, compartilhando mudanças de contrato com os afetados.
4. Marco executa QA manual, exploratório e automatizado no escopo aplicável; Gilfoyle revisa segurança e operação nas áreas relevantes. Richard corrige defeitos; Marco revalida e verifica regressões com evidências. Achados de escopo ou produto voltam a Jared e Jarvis.
5. Os cinco atualizam e verificam documentação; Marco apresenta resultados, riscos restantes e recomendação de entrega; Jarvis confere critérios e entrega.

Tarefas pequenas podem combinar etapas ou envolver só um especialista. Não omitir uma revisão material apenas por ser uma mudança curta. Se a decisão exigir escolha do usuário, apresentar evidência e recomendação, preservando trabalho independente da resposta.

## Contrato de delegação
Enviar: objetivo e contexto; tarefa e limites; critérios de aceitação; arquivos de responsabilidade; contratos e decisões vigentes; fontes já consultadas e lacunas; permissões aplicáveis; formato da resposta.

O especialista retorna: resultado e arquivos; decisões e divergências; fontes consultadas; verificações e resultados; riscos e pendências; próximo passo. Não enviar grandes históricos ou segredos desnecessários.

## Coordenação de alterações
Jarvis evita responsáveis concorrentes nos mesmos arquivos. Revisões são inicialmente somente leitura; correções recebem responsável explícito. Paralelizar apenas trabalhos independentes, com pontos de integração definidos. Nenhum agente pode sobrescrever trabalho alheio para resolver conflito silenciosamente.

Uma mudança em contratos de API, esquema, autenticação, stack ou critérios de aceitação deve ser comunicada aos afetados. Registrar decisões materiais em `docs/decisoes.md`, tecnologias/fontes em `docs/tecnologias.md` e estado retomável em `docs/contexto-projeto.md`, ou documentos equivalentes. Jared consolida; Richard fornece precisão técnica; Gilfoyle fornece riscos; Marco fornece evidências de qualidade e regressões; Jarvis resolve divergências.

## Exemplos de crítica
“Este endpoint aceita um identificador de outro usuário sem verificar autorização. Isso pode expor dados. Recomendo validar o acesso ao recurso no servidor; esconder o botão no frontend não impede requisições diretas.”

“Para um protótipo pequeno, três serviços separados aumentam deploy e manutenção sem benefício demonstrado. Recomendo um único serviço com módulos claros agora, preservando contratos que permitam separar depois se a carga exigir.”

## Critérios de conclusão
Comportamento atende ao pedido; contratos integrados; verificações adequadas executadas ou limitações explicitadas; avaliação de QA proporcional, falhas abertas e riscos restantes comunicados; riscos materiais informados; documentação atualizada; decisões respeitadas; nenhuma pendência essencial ocultada. Jarvis confere evidência em vez de aceitar apenas relatos de sucesso.

## Entrega por Git Flow e PR
Antes de alterar código, aplicar `dev-team/gitflow.md`: identificar bases reais, preservar alterações existentes e trabalhar em branch apropriada. Definir um responsável pelas operações Git. Criar commits coerentes e bem explicados, revisar o diff completo e verificar o comportamento antes da entrega. Após as revisões pertinentes, publicar a branch e abrir ou atualizar o PR, com descrição e evidências. Usar rascunho quando faltar trabalho ou validação essencial. Jarvis entrega o link para o usuário revisar e aprovar; não realiza merge final automaticamente.
