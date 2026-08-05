# 4. Relação entre tabelas

## Diagrama entidade-relacionamento

```mermaid
erDiagram
  auth_users ||--|| profiles : "1:1"
  profiles }o--o| portal_funcionarios : "funcionario_id"
  portal_funcionarios ||--o{ funcionario_obras : "tem"
  obras ||--o{ funcionario_obras : "autoriza"
  clientes ||--o{ obras : "possui"
  obras ||--o{ gastos_obra : "registra"
  obras ||--o{ notas_fiscais : "recebe"
  portal_funcionarios ||--o{ notas_fiscais : "envia"
  auth_users ||--o{ notas_fiscais : "auth_user_id"
  notas_fiscais ||--o{ notas_fiscais_eventos : "historico"
  notas_fiscais ||--o| gastos_obra : "origem opcional"
  auth_users ||--o{ assistente_conversas : "usuario_id"
  assistente_conversas ||--o{ assistente_mensagens : "contem"
  obras ||--o| assistente_conversas : "contexto"
  auth_users ||--o{ audit_logs : "usuario_id"

  auth_users {
    uuid id PK
    text email
  }

  profiles {
    uuid id PK
    text nome
    text role
    uuid funcionario_id FK
    boolean ativo
  }

  portal_funcionarios {
    uuid id PK
    text nome
    boolean ativo
  }

  funcionario_obras {
    uuid funcionario_id PK_FK
    uuid obra_id PK_FK
  }

  obras {
    uuid id PK
    uuid cliente_id FK
    text nome
    numeric orcamento_previsto
  }

  clientes {
    uuid id PK
    text nome
  }

  gastos_obra {
    uuid id PK
    uuid obra_id FK
    text categoria
    text etapa
    numeric valor_total
  }

  notas_fiscais {
    uuid id PK
    uuid obra_id FK
    uuid auth_user_id FK
    uuid funcionario_id FK
    text status_processamento
    text arquivo_path
  }

  audit_logs {
    uuid id PK
    uuid usuario_id FK
    text modulo
    text acao
  }
```

## Relacionamentos principais

| De | Para | Cardinalidade | Regra |
|----|------|---------------|-------|
| `profiles.id` | `auth.users.id` | 1:1 | Perfil criado no signup |
| `profiles.funcionario_id` | `portal_funcionarios.id` | N:1 | Funcionário vinculado ao cadastro portal |
| `funcionario_obras` | funcionário + obra | N:N | Autorização de envio por obra |
| `notas_fiscais.auth_user_id` | `auth.users.id` | N:1 | Ownership no portal |
| `notas_fiscais.obra_id` | `obras.id` | N:1 | Obra da nota |
| `gastos_obra.obra_id` | `obras.id` | N:1 | Gasto alocado |
| `obras.cliente_id` | `clientes.id` | N:1 | Cliente da obra |

## Integridade referencial

- **ON DELETE CASCADE** em notas → remove eventos e arquivos (via app).
- **Funcionário inativo** (`portal_funcionarios.ativo = false`) → não aparece em listagens admin ativas.
- **Perfil inativo** (`profiles.ativo = false`) → login bloqueado no middleware.

## Storage (não relacional)

```
storage.objects (bucket: notas-fiscais)
  └── {obra_id}/{uuid}/{filename}
       └── vinculado por notas_fiscais.arquivo_path
```

Policy: admin vê tudo; funcionário vê apenas arquivos das próprias notas.
