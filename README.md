# EquipControl: Sistema de Gestão de Equipamentos

## 📝 Sobre o Projeto

Este projeto é um Sistema de Gestão de Equipamentos desenvolvido como um projeto de final de curso. A aplicação consiste em uma API RESTful projetada para facilitar o controle e o empréstimo de equipamentos em ambientes institucionais, como universidades, escolas ou prefeituras.

A plataforma permite que usuários cadastrados solicitem a reserva de equipamentos (como notebooks, projetores, etc.), enquanto administradores podem gerenciar o inventário e aprovar ou rejeitar essas solicitações, garantindo um controle eficiente dos ativos da instituição.

## ✨ Funcionalidades Principais

O sistema possui dois níveis de acesso: **Usuário Padrão** e **Administrador**.

### Para todos os usuários:

  - **Autenticação Segura:** Sistema de registro e login com senhas criptografadas e autenticação baseada em tokens JWT.
  - **Listagem de Equipamentos:** Visualização dos tipos de equipamentos e das unidades físicas disponíveis para reserva.

### Para usuários autenticados:

  - **Criar Reservas:** Solicitar a reserva de uma unidade de equipamento para um período específico.
  - **Minhas Reservas:** Visualizar o histórico e o status de todas as suas solicitações de reserva.

### Para Administradores:

  - **Gestão de Inventário:**
      - Cadastrar novos **tipos** de equipamentos (Ex: "Notebook Dell Vostro").
      - Adicionar **unidades** físicas a cada tipo de equipamento (Ex: "Notebook \#001 com código de patrimônio XYZ").
  - **Gerenciamento de Reservas:**
      - Visualizar todas as reservas de todos os usuários.
      - **Aprovar**, **rejeitar** ou marcar uma reserva como **devolvida**. A aprovação de uma reserva altera o status do equipamento para "reservado".

## 🛠️ Tecnologias Utilizadas

O backend da aplicação foi construído utilizando as seguintes tecnologias:

  - **Python 3:** Linguagem de programação principal.
  - **FastAPI:** Framework web moderno e de alta performance para a construção da API.
  - **PostgreSQL:** Sistema de gerenciamento de banco de dados relacional.
  - **SQLAlchemy:** ORM (Object-Relational Mapper) para interação com o banco de dados.
  - **Pydantic:** Para validação de dados, garantindo a integridade dos dados que entram e saem da API.
  - **JWT (JSON Web Tokens):** Para garantir a segurança das rotas e a autenticação dos usuários.
  - **Uvicorn:** Servidor ASGI (Asynchronous Server Gateway Interface) para executar a aplicação FastAPI.

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar e executar o projeto em seu ambiente local.

### Pré-requisitos

  - **Python 3.10+**
  - **PostgreSQL** instalado e em execução.
  - **Git**

### 1\. Clone o Repositório

```bash
git clone https://github.com/SEU-USUARIO/gestao-equipamentos.git
cd gestao-equipamentos
```

### 2\. Crie e Ative um Ambiente Virtual

```bash
# Para Windows
python -m venv venv
.\venv\Scripts\activate

# Para macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3\. Instale as Dependências

```bash
pip install -r requirements.txt
```

### 4\. Configure o Banco de Dados

  - Crie um banco de dados no PostgreSQL. Por exemplo, `gestao_equipamentos_db`.
  - Execute o script SQL para criar as tabelas necessárias:
    ```sql
    -- Execute o conteúdo do arquivo gestao-equipamentos/docs/gestao_equipamentos_db.sql
    -- em seu cliente PostgreSQL para criar as tabelas 'users', 'equipment_types', etc.
    ```

### 5\. Configure as Variáveis de Ambiente

  - Crie um arquivo chamado `.env` na raiz do projeto, copiando o exemplo abaixo.
  - Substitua os valores pelas suas credenciais do PostgreSQL.

<!-- end list -->

```env
# .env
SECRET_KEY='sua-chave-secreta-forte'
DATABASE_URL='postgresql://postgres:sua-senha@localhost:5432/gestao_equipamentos_db'
JWT_SECRET_KEY='sua-outra-chave-secreta'
```

### 6\. Execute a Aplicação

Com o ambiente virtual ativado e as configurações prontas, inicie o servidor:

```bash
uvicorn main:app --reload
```

### 7\. Acesse a API

A API estará disponível em `http://127.0.0.1:8000`.

Para acessar a documentação interativa gerada automaticamente pelo FastAPI (baseada em OpenAPI/Swagger), visite:

  - **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

Lá você poderá testar todos os endpoints da API de forma interativa.

-----