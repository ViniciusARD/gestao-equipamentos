# EquipControl: Sistema de Gestão de Equipamentos

## 📝 Sobre o Projeto

O **EquipControl** é um Sistema de Gestão de Equipamentos robusto, desenvolvido com uma API RESTful em FastAPI e um frontend dinâmico. A aplicação foi projetada para facilitar o controle, o agendamento e o empréstimo de equipamentos em ambientes institucionais, como universidades, escolas ou empresas.

A plataforma permite que usuários solicitem a reserva de equipamentos (como notebooks, projetores, etc.), enquanto gerentes e administradores podem gerenciar o inventário, aprovar ou rejeitar solicitações, e monitorar a atividade do sistema, garantindo um controle eficiente dos ativos da instituição.

## ✨ Funcionalidades Principais

O sistema possui múltiplos níveis de acesso: **Usuário**, **Solicitante**, **Gerente** e **Admin**.

### Para todos os usuários (não autenticados):

  - **Cadastro de Conta**: Criação de um novo perfil com validação de força de senha em tempo real e aceite dos Termos de Uso e Política de Privacidade.
  - **Login Seguro**: Autenticação via e-mail e senha com tokens JWT, com suporte a **Autenticação de Dois Fatores (2FA)**.
  - **Recuperação de Senha**: Fluxo completo de "esqueci minha senha" com envio de link de redefinição por e-mail.
  - **Páginas Legais**: Visualização dos Termos de Uso e Política de Privacidade servidos dinamicamente pela API.

### Para Usuários Autenticados (nível `user` e superior):

  - **Dashboard Intuitiva**: Interface para visualizar suas próximas reservas e os equipamentos mais populares.
  - **Listagem de Equipamentos**: Visualização dos tipos de equipamentos e das unidades físicas disponíveis.
  - **Gestão de Perfil**: Atualizar o próprio nome de usuário e setor.
  - **Gerenciamento de Segurança**: Ativar e desativar a Autenticação de Dois Fatores (2FA) através de QR Code em apps autenticadores.
  - **Integração com Google Calendar**: Conectar e desconectar a conta Google para que reservas aprovadas sejam automaticamente adicionadas à agenda pessoal.
  - **Exclusão de Conta**: Deletar a própria conta (desde que não haja reservas ativas).

### Para Solicitantes (nível `requester` e superior):

  - **Criar Reservas**: Solicitar a reserva de uma unidade de equipamento para um período específico.
  - **Minhas Reservas**: Visualizar o histórico e o status (`pendente`, `aprovado`, `rejeitado`, `atrasado`, `devolvido`) de todas as suas solicitações, com filtros e ordenação.

### Para Gerentes (nível `manager` e superior):

  - **Gestão de Inventário Completa**:
      - Criar, visualizar, atualizar e deletar **tipos** de equipamentos (Ex: "Notebook Dell Vostro").
      - Adicionar, editar e remover **unidades** físicas para cada tipo (Ex: "Notebook \#001 com código XYZ").
      - Visualizar o **histórico de uma unidade** (criação, devolução, envio para manutenção).
  - **Gerenciamento de Reservas**:
      - Visualizar todas as reservas de todos os usuários com filtros avançados.
      - **Aprovar** ou **rejeitar** solicitações (disparando e-mails para o usuário).
      - Ao aprovar, o evento é criado no Google Calendar do solicitante (se conectado).
      - **Registrar devoluções** com status ("OK" ou "Com Defeito"), enviando a unidade para manutenção automaticamente.
      - Enviar **notificações de atraso** para reservas não devolvidas.
  - **Gestão de Usuários (Parcial)**:
      - Visualizar todos os usuários do sistema.
      - Visualizar o histórico de reservas de um usuário específico.

### Para Administradores (nível `admin`):

  - **Todas as funcionalidades de Gerente**.
  - **Painel de Análise (Analytics)**: Dashboard com gráficos (via Chart.js) e KPIs sobre o uso do sistema, incluindo:
      - Top 5 equipamentos mais reservados.
      - Top 5 setores que mais reservam.
      - Top 5 usuários que mais reservam.
      - Distribuição de reservas por status (Aprovadas, Pendentes, etc.).
      - Volume de reservas por dia da semana.
  - **Gerenciamento de Usuários Completo**:
      - Visualizar todos os usuários cadastrados com filtros avançados.
      - Alterar o **nível de permissão (role)**, **status (ativo/inativo)** e **setor** de qualquer usuário.
      - Deletar usuários do sistema (com validação para não deletar contas com reservas ativas).
  - **Gerenciamento de Setores**: Criar, editar e deletar os setores da instituição.
  - **Monitoramento do Sistema**:
      - Acessar os **logs de atividade** da aplicação com filtros avançados.
      - **Exportar logs** filtrados para um arquivo `.txt` para fins de auditoria.

## 🛠️ Tecnologias Utilizadas

#### Backend

  - **Python 3.10+**: Linguagem de programação principal.
  - **FastAPI**: Framework web moderno e de alta performance para a construção da API.
  - **PostgreSQL**: Sistema de gerenciamento de banco de dados relacional.
  - **SQLAlchemy**: ORM (Object-Relational Mapper) para interação com o banco de dados.
  - **Pydantic**: Validação de dados e gerenciamento de configurações.
  - **JWT (python-jose)**: Para garantir a segurança das rotas e a autenticação, com suporte a **Access Tokens e Refresh Tokens**.
  - **Passlib & Bcrypt**: Criptografia e verificação de senhas.
  - **Uvicorn**: Servidor ASGI para executar a aplicação FastAPI.
  - **Google API Client**: Para integração com a API do Google Calendar.
  - **FastAPI-Mail** e **Jinja2**: Para o envio de e-mails transacionais utilizando templates HTML.
  - **pyotp** e **qrcode**: Para geração e verificação de Autenticação de Dois Fatores (2FA).

#### Frontend

  - **HTML5**, **CSS3**, **JavaScript (ESM)**: Estrutura, estilo e interatividade.
  - **Bootstrap 5**: Framework CSS para a criação de uma interface responsiva.
  - **Bootstrap Icons**: Biblioteca de ícones.
  - **Vanilla JS**: Nenhuma biblioteca ou framework JS foi utilizado, apenas JavaScript puro para modularidade e dinamismo.
  - **Chart.js**: Para a renderização dos gráficos no Painel de Análise.

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar e executar o projeto completo (backend e frontend) em seu ambiente local.

### Pré-requisitos

  - **Python 3.10+**
  - **PostgreSQL** instalado e em execução.
  - **Git**
  - **VS Code** com a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (Recomendado para o frontend)

### 1\. Clone o Repositório

```bash
git clone https://github.com/ViniciusARD/gestao-equipamentos.git
cd gestao-equipamentos
```

### 2\. Configure o Ambiente Backend

```bash
# Crie e ative um ambiente virtual
python -m venv venv
.\venv\Scripts\activate  # No Windows
# source venv/bin/activate  # No macOS/Linux

# Instale as dependências Python
pip install -r requirements.txt
```

### 3\. Configure o Banco de Dados

1.  Crie um banco de dados no PostgreSQL. Por exemplo: `gestao_equipamentos_db`.
2.  Para criar a estrutura de tabelas, execute o conteúdo do arquivo `docs/gestao_equipamentos_db.sql` no seu cliente PostgreSQL preferido.
3.  (Opcional, mas recomendado) Para popular o banco com dados de exemplo, execute o conteúdo de `docs/gestao_equipamentos_db_seed.sql`.

### 4\. Configure as Variáveis de Ambiente (`.env`)

Esta é a etapa mais crucial. As funcionalidades do sistema dependem da configuração correta deste arquivo.

1.  Na raiz do projeto, crie um novo `.env` com base no exemplo abaixo.

2.  Abra o arquivo `.env` e preencha **TODAS** as variáveis. Elas são divididas em grupos:

    ```env
    # .env

    # --- Configurações Essenciais (OBRIGATÓRIO) ---
    # Chave para segurança interna do FastAPI
    SECRET_KEY='sua_chave_secreta_forte_aqui'
    # String de conexão com o seu banco de dados PostgreSQL
    DATABASE_URL='postgresql://postgres:sua_senha@localhost:5432/gestao_equipamentos_db'
    # Chave para criptografar os tokens de login (JWT)
    JWT_SECRET_KEY='sua_outra_chave_secreta_forte_aqui'

    # --- Configurações de Tempo do Token (Valores padrão) ---
    ACCESS_TOKEN_EXPIRE_MINUTES=60
    REFRESH_TOKEN_EXPIRE_DAYS=7

    # --- Configurações da API do Google (OBRIGATÓRIO para o fluxo do Google) ---
    # Sem isto, a integração com o Google Calendar não funcionará.
    # Obtenha essas chaves no Google Cloud Console.
    GOOGLE_CLIENT_ID='seu-client-id.apps.googleusercontent.com'
    GOOGLE_CLIENT_SECRET='seu-client-secret'

    # --- Configurações de Email (OBRIGATÓRIO para cadastro e recuperação de senha) ---
    # Sem isto, o registro de novos usuários e o "Esqueci minha senha" não funcionarão.
    MAIL_USERNAME="seu_email@gmail.com"
    MAIL_PASSWORD="sua_senha_de_app_do_gmail" # IMPORTANTE: Use uma "Senha de App" se tiver 2FA
    MAIL_FROM="seu_email@gmail.com"
    MAIL_PORT=587
    MAIL_SERVER="smtp.gmail.com"
    MAIL_STARTTLS=True
    MAIL_SSL_TLS=False
    ```

3.  **Credenciais do Google:** Além das variáveis no `.env`, você precisa ter o arquivo `client_secret.json` na raiz do projeto, obtido no Google Cloud Console.

> ⚠️ **Atenção:** Se as variáveis `GOOGLE_*` ou `MAIL_*` não forem configuradas, o backend ainda funcionará, mas as funcionalidades de **integração com Google Agenda**, **verificação de e-mail** e **recuperação de senha** irão falhar.

### 5\. Execute a Aplicação

#### 5.1. Backend (API)

Com o ambiente virtual ativado, inicie o servidor FastAPI:

```bash
uvicorn main:app --reload
```

A API estará rodando em `http://127.0.0.1:8000`.

#### 5.2. Frontend

O frontend é uma aplicação estática e precisa ser servida por um servidor web. A forma mais simples é:

1.  Abra a pasta do projeto no **VS Code**.
2.  Instale a extensão **Live Server**.
3.  Vá até a pasta `frontend/`, clique com o botão direito no arquivo `login.html` e selecione **"Open with Live Server"**.

O navegador abrirá automaticamente com a aplicação frontend, geralmente no endereço `http://127.0.0.1:5500/frontend/login.html`. Agora você pode se cadastrar e usar o sistema.

### 6\. Acesse a Documentação da API

O FastAPI gera automaticamente uma documentação interativa (Swagger UI). Para explorar e testar todos os endpoints da API, acesse:

  - **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**