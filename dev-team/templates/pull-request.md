# Modelo de descrição de PR

Guia editorial: usar o template do repositório quando existir. Remover orientações e seções inaplicáveis, preservando informação necessária para revisão.

## Problema e resultado
Explicar o objetivo e o comportamento resultante; incluir antes/depois com exemplo concreto quando ajudar.

## Mudanças e decisões
Descrever mudanças relevantes e o motivo da solução. Identificar alterações de contrato, dados ou configuração.

## Validação e revisão
Listar comandos ou fluxos realmente executados, resultados, escopo de QA e achados tratados. Distinguir revisão independente, auto-revisão e aprovação humana. Informar CI pendente, falhas, limites e testes não executados.

## Como revisar
Fornecer passos reproduzíveis para o usuário verificar o resultado, com requisitos e dados fictícios quando necessários. Screenshots e links somente quando reais.

## Documentação e impacto
Indicar README/documentação atualizados, migrações, configuração, compatibilidade e riscos restantes. Explicar recuperação quando relevante e viável.

## Integração
Informar branch de origem e destino. Para release/hotfix, identificar propagação para as demais branches e o que ainda falta. O PR aguarda revisão e aprovação do usuário; este registro não autoriza merge ou deploy.
