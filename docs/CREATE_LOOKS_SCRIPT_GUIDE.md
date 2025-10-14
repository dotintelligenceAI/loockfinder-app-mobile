# Script de Criação Automática de Looks

## Visão Geral

Este script permite criar looks automaticamente a partir de imagens armazenadas no Supabase Storage, associando-os a categorias e subcategorias específicas.

## Funcionalidades

- ✅ **Listar buckets** disponíveis no Supabase Storage
- ✅ **Navegar por pastas** dentro dos buckets
- ✅ **Escolher categoria e subcategoria** para os looks
- ✅ **Criar looks automaticamente** na tabela do banco
- ✅ **Interface interativa** com menu de opções
- ✅ **Validação de dados** e tratamento de erros
- ✅ **Relatório de progresso** detalhado

## Como Usar

### 1. Executar o Script

```bash
# Usando npm script (recomendado)
npm run create-looks

# Ou executar diretamente
node ./scripts/create-looks-from-storage.js
```

### 2. Fluxo do Script

O script seguirá este fluxo interativo:

1. **Listar Buckets**: Mostra todos os buckets disponíveis
2. **Escolher Bucket**: Seleciona o bucket desejado
3. **Listar Pastas**: Mostra todas as pastas do bucket
4. **Escolher Pasta**: Seleciona a pasta com as imagens
5. **Listar Imagens**: Mostra todas as imagens da pasta
6. **Escolher Categoria**: Seleciona a categoria para os looks
7. **Escolher Subcategoria**: (Opcional) Seleciona subcategoria
8. **Confirmar Criação**: Confirma antes de criar os looks
9. **Criar Looks**: Processa todas as imagens automaticamente

### 3. Exemplo de Uso

```
🎨 === CRIADOR AUTOMÁTICO DE LOOKS ===

🪣 Buscando buckets disponíveis...

📦 Buckets encontrados:
  1. user-uploads (Público)
  2. looks-images (Público)

Escolha o bucket (número): 2

✅ Bucket selecionado: looks-images

📁 Buscando pastas no bucket "looks-images"...

📂 Pastas encontradas:
  1. casual
  2. formal
  3. esportivo

Escolha a pasta (número): 1

✅ Pasta selecionada: casual

🖼️  Buscando imagens na pasta "casual"...

📸 15 imagens encontradas:
  1. look-casual-1.jpg
  2. look-casual-2.jpg
  3. look-casual-3.jpg
  ...

📋 Categorias disponíveis:
  1. Acessórios (acessorios)
  2. Ocasião de Uso (ocasiao_uso)
  3. Cores (cores)
  4. Estampas e Materiais (estampas_materiais)
  5. Partes (partes)
  6. Tendências (tendencias)

Escolha a categoria (número): 2

✅ Categoria selecionada: Ocasião de Uso

📋 Subcategorias disponíveis:
  1. Casual (casual)
  2. Trabalho (trabalho)
  3. Festa (festa)

Escolha a subcategoria (número) ou pressione Enter para pular: 1

✅ Subcategoria selecionada: Casual

📋 RESUMO:
   Bucket: looks-images
   Pasta: casual
   Categoria: Ocasião de Uso
   Subcategoria: Casual
   Imagens: 15

Deseja criar os looks? (s/n): s

🚀 Criando looks...

📸 Processando 1/15: look-casual-1.jpg
✅ Look criado com sucesso: 123e4567-e89b-12d3-a456-426614174000

📸 Processando 2/15: look-casual-2.jpg
✅ Look criado com sucesso: 123e4567-e89b-12d3-a456-426614174001

...

🎉 === PROCESSO CONCLUÍDO ===
✅ Looks criados com sucesso: 15
❌ Erros: 0
📊 Total processado: 15
```

## Estrutura dos Dados

### Tabela `looks`

O script cria registros na tabela `looks` com os seguintes campos:

```sql
CREATE TABLE looks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  categories_id UUID REFERENCES categories(id),
  subcategorias_id UUID REFERENCES subcategorias(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Campos Preenchidos Automaticamente

- **`title`**: Baseado no nome do arquivo (ex: "look-casual-1" → "Look Casual 1")
- **`description`**: Descrição padrão com nome do arquivo
- **`image_url`**: URL pública da imagem no Supabase Storage
- **`categories_id`**: ID da categoria selecionada
- **`subcategorias_id`**: ID da subcategoria selecionada (opcional)
- **`created_at`**: Timestamp atual

## Requisitos

### Dependências

O script usa as seguintes dependências (já instaladas no projeto):

```json
{
  "@supabase/supabase-js": "^2.49.8"
}
```

### Configuração

O script usa as credenciais do Supabase configuradas em `config/supabase.ts`:

```typescript
const SUPABASE_URL = 'https://jlqjgsnjthrhapiaespq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## Tratamento de Erros

### Erros Comuns

1. **Bucket não encontrado**: Verifica se o bucket existe e tem permissões
2. **Pasta vazia**: Verifica se a pasta contém imagens
3. **Categoria inválida**: Verifica se a categoria existe no banco
4. **Erro de upload**: Retry automático com pausa entre tentativas

### Logs Detalhados

O script fornece logs detalhados para debugging:

```
🚀 Iniciando upload via Supabase API: look-casual-1.jpg
📦 Blob criado, tamanho: 2048576 bytes
📤 Fazendo upload para: casual/look-casual-1.jpg
✅ Upload Supabase concluído: https://...
🔗 URL pública gerada: https://...
```

## Dicas de Uso

### 1. Organização das Imagens

- Organize as imagens em pastas por categoria
- Use nomes descritivos para os arquivos
- Mantenha um tamanho razoável (recomendado: < 5MB)

### 2. Estrutura de Pastas Recomendada

```
bucket-name/
├── casual/
│   ├── look-casual-1.jpg
│   ├── look-casual-2.jpg
│   └── ...
├── formal/
│   ├── look-formal-1.jpg
│   └── ...
└── esportivo/
    ├── look-esportivo-1.jpg
    └── ...
```

### 3. Nomenclatura de Arquivos

- Use hífens ou underscores para separar palavras
- Evite caracteres especiais
- Exemplo: `look-casual-verao-1.jpg`

## Troubleshooting

### Problema: "Nenhum bucket encontrado"

**Solução**: Verifique se:
- As credenciais do Supabase estão corretas
- O projeto tem buckets criados
- As permissões estão configuradas

### Problema: "Erro ao criar look"

**Solução**: Verifique se:
- A tabela `looks` existe
- As foreign keys estão corretas
- As categorias/subcategorias existem

### Problema: "Imagens não encontradas"

**Solução**: Verifique se:
- A pasta contém arquivos de imagem
- As extensões são suportadas (.jpg, .jpeg, .png, .gif, .webp, .svg)
- As permissões de leitura estão corretas

## Segurança

### Permissões Necessárias

O script precisa das seguintes permissões:

- **Storage**: Leitura de buckets e arquivos
- **Database**: Inserção na tabela `looks`
- **RLS**: Políticas de Row Level Security configuradas

### Boas Práticas

- Execute o script em ambiente de desenvolvimento primeiro
- Faça backup do banco antes de executar em produção
- Monitore o uso de storage e database
- Configure rate limiting se necessário

## Suporte

Para problemas ou dúvidas:

1. Verifique os logs de erro
2. Confirme as configurações do Supabase
3. Teste com uma pequena quantidade de imagens primeiro
4. Consulte a documentação do Supabase Storage
