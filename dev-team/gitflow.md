# Autonomia Git, commits e pull requests

## Autorização e ponto de aprovação
Para tarefas de implementação solicitadas no projeto, o usuário autoriza o time a criar branches de trabalho, implementar, testar, criar commits, revisar, publicar essas branches no remoto do próprio projeto e abrir ou atualizar PRs. Não pedir confirmação para cada uma dessas etapas quando estiverem dentro do escopo autorizado e as ferramentas permitirem. A aprovação final do PR permanece com o usuário.

Esta autonomia não autoriza aprovar o próprio PR em nome do usuário, realizar merge final em branches de integração ou produção, ativar auto-merge, publicar releases/tags de produção, fazer deploy, alterar proteções, forçar push ou apagar trabalho alheio. Uma autorização posterior específica pode ampliar esse escopo. Resolver conflitos na branch de trabalho é permitido quando os contratos e decisões estiverem claros; escalar divergências que exijam uma decisão de produto.

As permissões reais do ambiente continuam aplicáveis. Se faltar autenticação ou acesso remoto, preparar commits e o conteúdo do PR, informar o bloqueio exato e não alegar que publicou ou abriu o PR. Usar identidade Git configurada, sem inventar identidade, assinatura ou credenciais. Criar PRs é uma ação autorizada; isso não autoriza mensagens externas, comentários não relacionados ou marcações de pessoas não escolhidas pelo usuário.

## Descobrir antes de trabalhar
Inspecionar estado do checkout, mudanças existentes, remotos, branches locais e remotas, branch padrão, proteções e templates do repositório. Identificar a branch de produção (`main`, `master` ou equivalente) e a de integração (`develop` ou equivalente) a partir de evidências. Registrar esse mapeamento no contexto do projeto.

Não supor que a branch padrão é a branch de integração. Se não houver Git Flow configurado ou a base estiver ambígua, explicar o que falta e propor o mapeamento ou criação inicial necessária para decisão do usuário, mantendo trabalho independente em andamento. Não alterar unilateralmente a estrutura de branches compartilhadas. Não instalar uma extensão git-flow: Git comum ou as ferramentas nativas são suficientes.

Preservar alterações existentes. Não trocar de branch carregando mudanças alheias silenciosamente nem fazer stash, reset ou limpeza destrutiva para obter um checkout limpo. Usar isolamento quando necessário e disponível; confirmar a base e o conteúdo que entrará na branch. Não incluir em commits arquivos ou alterações não pertencentes à tarefa.

## Git Flow do projeto
Usar nomes de produção e integração efetivamente descobertos. Prefixos abaixo são a convenção padrão deste kit; respeitar convenções equivalentes já definidas no repositório.

| Trabalho | Branch de origem | Branch de trabalho | PR de destino |
| --- | --- | --- | --- |
| Funcionalidade | Integração | `feature/descricao-curta` | Integração |
| Correção comum | Integração | `fix/descricao-curta` | Integração |
| Documentação, testes ou manutenção | Integração | Branch temática conforme convenção local | Integração |
| Preparação de release solicitada | Integração | `release/versao-confirmada` | Produção; retorno das correções à integração |
| Correção urgente de produção | Produção ou versão efetivamente implantada | `hotfix/descricao-curta` | Produção e integração; se houver release ativa, considerar propagação por ela |

`fix/` e branches temáticas são convenções de organização deste kit, não novos papéis de branch principal. Hotfix é definido pela necessidade de corrigir produção, não apenas pela palavra “bug”. Não iniciar release ou atribuir versão sem escopo e política de versionamento conhecidos. Para release e hotfix, deixar explícito no PR o caminho de propagação; não considerar o trabalho totalmente integrado enquanto esse caminho estiver pendente. Preparar PRs complementares com bases corretas quando viável, ou registrar a etapa posterior e seu responsável sem inventar que ela foi concluída.

Nomes devem ser curtos, descritivos, sem dados sensíveis e com identificador de tarefa quando existir. Antes de reutilizar uma branch, verificar se pertence à tarefa e se não introduz alterações de outro trabalho. Definir explicitamente head e base do PR. As integrações finais são feitas por PR após revisão e aprovação do usuário, respeitando a estratégia de merge do projeto. Não executar comandos de finalização de Git Flow que façam merge, tag ou push nas branches principais sem autorização específica.

## Commits bem explicados
Separar commits por mudanças coerentes e revisáveis, sem fragmentar artificialmente cada linha ou reunir trabalhos não relacionados. Inspecionar o diff preparado antes de cada commit e executar as verificações relevantes disponíveis. Commits intermediários não significam aprovação de entrega; se uma limitação impedir validação, identificá-la no corpo e no PR. Não burlar hooks nem omitir falhas para conseguir um commit.

Seguir a convenção do repositório; na ausência dela, usar assunto como `feat(escopo): resultado`, `fix(escopo): comportamento corrigido`, `test(escopo): cenário coberto` ou `docs(escopo): orientação atualizada`, com descrição concisa. O corpo deve explicar problema ou objetivo, comportamento resultante, motivo das decisões relevantes e validação realizada. Incluir migrações, incompatibilidades e referências verificadas quando aplicáveis. Para mudanças pequenas, usar detalhe proporcional; evitar mensagens vagas como “ajustes”, “update” ou “fix bug”. Não atribuir coautoria ou afirmar revisão que não aconteceu.

Usar `dev-team/templates/commit.md` como guia, removendo orientações e seções inaplicáveis. Idioma padrão: português, salvo convenção do projeto. Evitar piadas nos registros formais para manter histórico claro.

## Revisão antes do PR
Richard verifica correção técnica e integração; Gilfoyle revisa segurança e operação relevantes; Marco verifica comportamento e regressões; Jared confere critérios e documentação; Jarvis consolida a entrega. Escalar apenas papéis pertinentes ao risco. Revisão independente deve ocorrer em contexto separado quando houver delegação disponível; caso contrário, informar que houve auto-revisão. Não apresentar auto-revisão como aprovação humana.

Revisar o diff completo em relação à base do PR, não apenas o último commit. Verificar escopo, arquivos acidentais, segredos, compatibilidade, testes e documentação. Corrigir achados materiais e revalidar antes de anunciar que está pronto. CI ainda pendente deve ser reportada como pendente.

## Abrir e manter o PR
Publicar apenas a branch de trabalho no remoto correto. Abrir um PR por mudança coerente; consultar os PRs existentes da branch para não duplicar. Seguir o template do repositório, complementando-o com informação necessária. Usar `dev-team/templates/pull-request.md` quando não houver template local.

O título deve identificar problema ou resultado. A descrição explica objetivo, antes/depois quando útil, mudanças relevantes e motivos, evidências de testes e QA, revisão realizada, documentação, migrações/configuração, riscos ou limitações e passos para o usuário verificar. Informar base/head e caminho de propagação de release/hotfix quando pertinente. Usar links reais e screenshots reais somente quando agregarem; nunca inventar resultados ou URLs.

Trabalho incompleto, com falhas materiais ou validação essencial bloqueada deve ser PR em rascunho, com estado e pendências visíveis, quando o provedor oferecer esse recurso. Trabalho revisado e verificado pode ser aberto pronto para revisão. Atualizar título e corpo se o escopo mudar; não deixar conclusões de uma versão anterior após novos commits.

Entregar ao usuário o link do PR, resumo da mudança, verificações e limites, e informar que aguarda sua revisão e aprovação. Anexar o PR à conversa quando a plataforma oferecer recurso para isso. Não aprovar, integrar ou ativar auto-merge automaticamente. Se comentários de revisão forem disponibilizados ou a revisão for atribuída ao time, avaliar o feedback com fundamento, corrigir na mesma branch e atualizar evidências e descrição.

## Coordenação
Jarvis define um responsável pelas operações Git e pela abertura do PR. Richard normalmente cria branch, commits e correções. Os outros especialistas podem criar commits de suas mudanças quando atribuídos, mas não devem disputar index, checkout ou push no mesmo diretório. Paralelizar com worktrees ou branches isoladas e integração planejada quando adequado. Jared organiza a narrativa; Marco fornece resultados de QA; Gilfoyle informa riscos; Jarvis confere o PR e o apresenta ao usuário.
