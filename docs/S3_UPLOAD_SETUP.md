# Configuração de Upload S3 Direto

## Visão Geral

O sistema de upload foi otimizado para usar o endpoint S3 direto da Supabase, proporcionando melhor performance, especialmente para arquivos grandes.

## Configuração

### Variáveis de Ambiente S3

As seguintes credenciais S3 estão configuradas em `config/supabase.ts`:

```typescript
export const s3Config = {
  endpoint: 'https://jlqjgsnjthrhapiaespq.storage.supabase.co/storage/v1/s3',
  region: 'project_region',
  accessKeyId: '4d0c1dd423eaff66f50b7f1edb64dca6',
  secretAccessKey: '5ddae4ed27954e2e8e9962fefb7184517512ded798920ecc585803663992571e',
  bucket: 'user-uploads',
  forcePathStyle: true
};
```

## Serviço de Upload S3

### Arquivo: `services/s3UploadService.ts`

O serviço fornece:

1. **Upload via Supabase API**: `uploadViaSupabaseAPI()` - Método oficial e mais confiável
2. **Upload via URL Assinada**: `uploadViaSignedURL()` - Para casos especiais  
3. **Upload Principal**: `uploadAvatar()` - Função principal com fallback automático

### Funcionalidades

- ✅ **Upload via SDK oficial** do Supabase (com assinatura automática)
- ✅ **Fallback automático** para URL assinada em caso de erro
- ✅ **Nomes únicos** de arquivo com timestamp
- ✅ **Validação de tipos** de arquivo
- ✅ **Logs detalhados** para debugging
- ✅ **URLs públicas** geradas automaticamente

### Estrutura de Pastas

```
user-uploads/
└── foto_perfil/
    ├── user123_1698765432_avatar.jpg
    ├── user456_1698765433_avatar.png
    └── ...
```

## Integração no Perfil

### Atualização em `app/(tabs)/perfil.tsx`

A função `uploadAvatar` foi simplificada para usar o novo serviço:

```typescript
const uploadAvatar = async (uri: string) => {
  try {
    setUploading(true);
    
    // Verificar arquivo local
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Arquivo de imagem não encontrado');
    }

    // Criar blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload via Supabase Storage (com assinatura automática)
    const fileName = `avatar_${Date.now()}.jpg`;
    const uploadResult = await s3UploadService.uploadAvatar(blob, fileName, user?.id);

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Erro no upload');
    }

    return uploadResult.url;
  } catch (error) {
    // Handle error
  } finally {
    setUploading(false);
  }
};
```

## Vantagens do Upload S3 Direto

### Performance
- 🚀 **Velocidade aumentada** especialmente para arquivos grandes
- 📦 **Menos overhead** no servidor Supabase
- 🔄 **Upload paralelo** possível para múltiplos arquivos

### Confiabilidade
- 🔒 **Conexão direta** com storage S3
- 🛡️ **Menos pontos de falha** na cadeia de upload
- 📊 **Logs detalhados** para debugging

### Escalabilidade
- 📈 **Melhor handling** de arquivos grandes (>10MB)
- 🌐 **CDN nativo** do S3 para distribuição global
- ⚡ **Menos carga** no servidor principal

## Debugging

### Logs de Upload

O serviço produz logs detalhados:

```
🔄 Tentando upload via Supabase API...
🚀 Iniciando upload via Supabase API: avatar_1698765432.jpg
📦 Blob criado, tamanho: 2048576 bytes  
📤 Fazendo upload para: foto_perfil/user123_1698765432_avatar.jpg
✅ Upload Supabase concluído: https://...
🔗 URL pública gerada: https://...
```

### Tipos de Erro Comuns

1. **Arquivo não encontrado**: Verificar se o arquivo local existe
2. **Erro de rede**: Verificar conectividade
3. **Missing signature** (RESOLVIDO): Agora usa SDK oficial do Supabase
4. **Arquivo muito grande**: Limite atual é 10MB
5. **RLS Policy**: Verificar políticas de Row Level Security no bucket

## Segurança

### Políticas de Acesso

- ✅ **Arquivos públicos** para avatares de perfil
- ✅ **Nomes únicos** para evitar conflitos
- ✅ **Validação de tipos** de arquivo
- ✅ **Limite de tamanho** configurável

### Credenciais

As credenciais S3 estão configuradas para:
- 📁 **Acesso específico** ao bucket `user-uploads`
- 🔐 **Permissões limitadas** apenas para upload
- ⏰ **Tokens com expiração** (implementação futura)

## Próximos Passos

1. **Implementar upload assinado** para maior segurança
2. **Adicionar compressão** automática de imagens
3. **Suporte a múltiplos formatos** (WebP, AVIF)
4. **Cache inteligente** para otimização

---

**Nota**: Esta configuração melhora significativamente a performance de upload, especialmente para imagens de alta resolução e conexões mais lentas.
