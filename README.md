# EquipControl: Sistema de Gestão de Equipamentos

## 📝 Sobre o Projeto

O **EquipControl** é um Sistema de Gestão de Equipamentos robusto, desenvolvido com uma API RESTful em FastAPI e um frontend dinâmico. A aplicação foi projetada para facilitar o controle, o agendamento e o empréstimo de equipamentos em ambientes institucionais, como universidades, escolas ou empresas.

A plataforma permite que usuários solicitem a reserva de equipamentos (como notebooks, projetores, etc.), enquanto gerentes e administradores podem gerenciar o inventário, aprovar ou rejeitar solicitações, e monitorar a atividade do sistema, garantindo um controle eficiente dos ativos da instituição.

## ✨ Funcionalidades Principais

O sistema possui múltiplos níveis de acesso: **Usuário**, **Solicitante**, **Gerente** e **Admin**.

### Para todos os usuários (não autenticados):

  - **Cadastro de Conta**: Criação de um novo perfil de usuário.
  - **Login Seguro**: Autenticação via e-mail e senha com tokens JWT.
  - **Recuperação de Senha**: Fluxo completo de "esqueci minha senha" com envio de link de redefinição por e-mail.

### Para Usuários Autenticados (nível `user` e superior):

  - **Dashboard Intuitiva**: Interface para visualizar e interagir com o sistema.
  - **Listagem de Equipamentos**: Visualização dos tipos de equipamentos e das unidades físicas disponíveis.
  - **Gestão de Perfil**: Atualizar o próprio nome de usuário e deletar a própria conta.
  - **Integração com Google Calendar**: Conectar a conta Google para que reservas aprovadas sejam automaticamente adicionadas à agenda pessoal.

### Para Solicitantes (nível `requester` e superior):

  - **Criar Reservas**: Solicitar a reserva de uma unidade de equipamento para um período específico.
  - **Minhas Reservas**: Visualizar o histórico e o status (`pendente`, `aprovado`, `rejeitado`) de todas as suas solicitações.

### Para Gerentes (nível `manager` e superior):

  - **Gestão de Inventário Completa**:
      - Criar, visualizar, atualizar e deletar **tipos** de equipamentos (Ex: "Notebook Dell Vostro").
      - Adicionar, editar e remover **unidades** físicas para cada tipo (Ex: "Notebook \#001 com código XYZ").
  - **Gerenciamento de Reservas**:
      - Visualizar todas as reservas de todos os usuários.
      - **Aprovar**, **rejeitar** ou marcar uma reserva como **devolvida**.
      - A aprovação de uma reserva altera o status da unidade para "reservado" e pode criar um evento no Google Calendar do solicitante.

### Para Administradores (nível `admin`):

  - **Todas as funcionalidades de Gerente**.
  - **Gerenciamento de Usuários**:
      - Visualizar todos os usuários cadastrados no sistema.
      - Alterar o nível de permissão (role) de qualquer usuário.
      - Deletar usuários do sistema.
  - **Monitoramento do Sistema**:
      - Acessar os **logs de atividade** da aplicação para auditoria.

## 🛠️ Tecnologias Utilizadas

#### Backend

  - **Python 3.10+**: Linguagem de programação principal.
  - **FastAPI**: Framework web moderno e de alta performance para a construção da API.
  - **PostgreSQL**: Sistema de gerenciamento de banco de dados relacional.
  - **SQLAlchemy**: ORM (Object-Relational Mapper) para interação com o banco de dados.
  - **Pydantic**: Validação de dados e gerenciamento de configurações.
  - **JWT (python-jose)**: Para garantir a segurança das rotas e a autenticação dos usuários.
  - **Passlib & Bcrypt**: Criptografia e verificação de senhas.
  - **Uvicorn**: Servidor ASGI para executar a aplicação FastAPI.
  - **Google API Client**: Para integração com a API do Google Calendar.
  - **FastAPI-Mail**: Para o envio de e-mails transacionais (redefinição de senha).

#### Frontend

  - **HTML5**, **CSS3**, **JavaScript (ES6 Modules)**: Estrutura, estilo e interatividade.
  - **Bootstrap 5**: Framework CSS para a criação de uma interface responsiva.
  - **Bootstrap Icons**: Biblioteca de ícones.
  - **Vanilla JS**: Nenhuma biblioteca ou framework JS foi utilizado, apenas JavaScript puro para modularidade e dinamismo.

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar e executar o projeto completo (backend e frontend) em seu ambiente local.

### Pré-requisitos

  - **Python 3.10+**
  - **PostgreSQL** instalado e em execução.
  - **Git**
  - **VS Code** com a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (Recomendado para o frontend)

### 1\. Clone o Repositório

```bash
git clone https://github.com/SEU-USUARIO/gestao-equipamentos.git
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

1.  Na raiz do projeto, **crie uma cópia** do arquivo `.env example` e renomeie-a para `.env`.

2.  Abra o arquivo `.env` e preencha **TODAS** as variáveis. Elas são divididas em grupos:

    ```env
    # .env

    # --- Configurações Essenciais (OBRIGATÓRIO) ---
    # Chave para segurança interna do FastAPI
    SECRET_KEY='gere_uma_chave_forte_aqui'
    # String de conexão com o seu banco de dados PostgreSQL
    DATABASE_URL='postgresql://postgres:sua_senha@localhost:5432/gestao_equipamentos_db'
    # Chave para criptografar os tokens de login (JWT)
    JWT_SECRET_KEY='gere_outra_chave_forte_diferente_aqui'

    # --- Configurações da API do Google (FUNCIONALIDADE OPCIONAL) ---
    # Sem isto, a integração com o Google Calendar não funcionará.
    # Obtenha essas chaves no Google Cloud Console.
    GOOGLE_CLIENT_ID='seu-client-id.apps.googleusercontent.com'
    GOOGLE_CLIENT_SECRET='seu-client-secret'

    # --- Configurações de Email (FUNCIONALIDADE OPCIONAL) ---
    # Sem isto, a funcionalidade de "Esqueci minha senha" não funcionará.
    MAIL_USERNAME="seu_email@gmail.com"
    MAIL_PASSWORD="sua_senha_de_app_do_gmail" # IMPORTANTE: Use uma "Senha de App" se tiver 2FA
    MAIL_FROM="seu_email@gmail.com"
    MAIL_PORT=587
    MAIL_SERVER="smtp.gmail.com"
    MAIL_STARTTLS=True
    MAIL_SSL_TLS=False
    ```

3.  **Credenciais do Google:** Além das variáveis no `.env`, você precisa ter o arquivo `client_secret.json` na raiz do projeto, obtido no Google Cloud Console.

> ⚠️ **Atenção:** Se as variáveis `GOOGLE_*` ou `MAIL_*` não forem configuradas, o backend ainda funcionará, mas as funcionalidades de **integração com Google Agenda** e **recuperação de senha** irão falhar.

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