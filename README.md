# FITCOACH V3 ONLINE

Esta versão troca o armazenamento local das versões anteriores por **Supabase Auth + Postgres** e está preparada para deploy em **Vercel**.

## O que já está implementado

- Cadastro e login real com e-mail/senha.
- Conta `Personal` e conta `Aluno`.
- Row Level Security (RLS) para isolar dados.
- Personal cadastra alunos.
- Cada aluno recebe um código de convite.
- Aluno cria sua própria conta e usa o código para se vincular ao personal.
- Personal cria fichas e exercícios.
- Aluno visualiza e conclui treinos.
- Histórico online.
- Registro de peso e cintura.
- Dados persistidos no Supabase.

## 1. Criar o projeto no Supabase

1. Crie um projeto Supabase.
2. Abra **SQL Editor**.
3. Cole e execute todo o arquivo `supabase_schema.sql`.
4. Abra o painel **Connect** do projeto e copie:
   - Project URL
   - Publishable key

> Não coloque `service_role` no frontend.

## 2. Configurar o projeto

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
```

## 3. Rodar no computador

É necessário Node.js instalado.

```bash
npm install
npm run dev
```

## 4. Colocar na Vercel

Forma simples:

1. Coloque estes arquivos em um repositório GitHub.
2. Na Vercel, importe esse repositório.
3. Framework: **Vite**.
4. Adicione as duas variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Faça o deploy.

A Vercel normalmente detecta `npm run build` e a saída `dist` para Vite.

## Fluxo do produto

### Personal
Cria conta → cadastra aluno → copia código de convite → monta treino → acompanha evolução.

### Aluno
Cria conta do tipo Aluno → informa código de convite → acessa ficha → conclui treino → histórico é salvo.

## Antes de vender

Esta V3 é uma base técnica/MVP. Antes de uso comercial em produção, revise:
- LGPD e política de privacidade.
- Termos de uso.
- Recuperação de senha.
- Confirmação de e-mail.
- Logs e monitoramento.
- Backups.
- Exclusão de conta/dados.
- Regras profissionais aplicáveis à prescrição de exercício.
- Testes de segurança e RLS.

Nunca use a chave `service_role` dentro do navegador.
