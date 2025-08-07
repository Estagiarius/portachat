# portachat
Um chat portátil escrito para Windows para a conexão e uso com uma OpenAI API. 

# Documentação do Projeto: Chat Desktop de Alta Performance com API OpenAI

## 1. Visão Geral

O objetivo deste projeto é desenvolver uma aplicação de desktop para **Windows** que funcione como um front-end para a API da OpenAI. A aplicação será otimizada para **alta performance em hardware com recursos limitados** (ex: processadores Intel Celeron, pouco espaço em disco) e terá como requisito a **instalação mínima**, podendo ser executada sem privilégios de administrador. O suporte à renderização de **Markdown** para as respostas da IA continua sendo um requisito essencial.

Este documento serve como a única fonte de verdade para o desenvolvimento, contendo todos os requisitos, decisões de arquitetura e o plano de implementação.

---

## 2. Requisitos do Sistema

### 2.1. Requisitos Funcionais (O que o sistema deve fazer)

* **RF-01:** O usuário deve ser capaz de digitar e enviar uma mensagem de texto para a IA.
* **RF-02:** A aplicação deve exibir a resposta da IA na interface de chat.
* **RF-03:** A resposta da IA deve ser renderizada corretamente, com suporte para a sintaxe Markdown (negrito, itálico, listas, blocos de código, etc.).
* **RF-04:** O usuário deve poder inserir e salvar sua chave de API da OpenAI para uso nas requisições.
* **RF-05:** A interface deve exibir o histórico da conversa atual em uma área rolável.
* **RF-06:** A aplicação deve fornecer um feedback visual (ex: indicador "digitando...") enquanto aguarda a resposta da IA.

### 2.2. Requisitos Não-Funcionais (Como o sistema deve ser)

* **RNF-01 (Performance):** A aplicação deve ter baixo consumo de CPU e RAM, garantindo uma experiência fluida em hardware com especificações modestas (ex: Intel Celeron N4500).
* **RNF-02 (Portabilidade):** A aplicação deve ser distribuída como um único arquivo executável (`.exe`), sem a necessidade de um processo de instalação.
* **RNF-03 (Permissões):** A aplicação não deve exigir privilégios de administrador para ser executada.
* **RNF-04 (Tamanho):** O tamanho final do arquivo executável deve ser o menor possível, idealmente abaixo de 20MB.
* **RNF-05 (Segurança):** A chave de API da OpenAI não deve ser exposta no código do front-end e deve ser armazenada de forma segura.

---

## 3. Arquitetura e Tecnologias (Foco em Performance)

Para atender aos rigorosos requisitos de performance, tamanho e portabilidade, a stack tecnológica foi redefinida.

* **Framework Principal: [Tauri](https://tauri.app/)**
    * **Por quê?** Tauri utiliza o **webview nativo do Windows (WebView2)**, resultando em um binário final extremamente pequeno e eficiente em consumo de recursos. O backend em **Rust** garante performance e segurança.

* **Linguagens de Front-end:**
    * **HTML5, CSS3, JavaScript (ES6+):** Para a construção de uma interface de usuário rápida e flexível.

* **Renderização de Markdown: [Marked.js](https://marked.js.org/)**
    * **Por quê?** É uma biblioteca leve e rápida para converter Markdown em HTML no lado do cliente.

* **Comunicação com a API (Backend em Rust):**
    * **Reqwest (Rust Crate):** Para realizar as chamadas HTTP à API da OpenAI de forma segura e performática a partir do backend.

---

## 4. Estrutura do Projeto (Tauri)

A estrutura de um projeto Tauri separa claramente o backend (Rust) do front-end (web).

```
/meu-chat-app
|
├── /src/                  # Código do Front-end
|   ├── 📄 index.html
|   ├── 📄 style.css
|   └── 📄 main.js          # Lógica do front-end
|
├── /src-tauri/            # Código do Backend (Rust)
|   ├── build.rs
|   ├── Cargo.toml         # Dependências do Rust (ex: reqwest)
|   └── src
|       └── 📄 main.rs      # Ponto de entrada da aplicação Rust
|
└── 📄 tauri.conf.json      # Configurações da aplicação Tauri
```

---

## 5. Plano de Implementação em Cascata

A seguir, a ordem de desenvolvimento a ser seguida para garantir uma implementação sequencial e sem conflitos.

### Fase 1: Configuração do Ambiente e Estrutura do Projeto

1.  **Setup do Ambiente:** Instalar a toolchain do Rust e as dependências do Tauri conforme o [guia oficial](https://tauri.app/v1/guides/getting-started/prerequisites).
2.  **Criação do Projeto:** Executar `npm create tauri-app@latest` para gerar o esqueleto da aplicação.
3.  **Validação:** Executar `npm run tauri dev` para confirmar que a janela da aplicação abre corretamente.
4.  **Commit:** Realizar o commit inicial com a estrutura base do projeto.

### Fase 2: Desenvolvimento da Interface Estática (Front-end)

1.  **Estrutura HTML:** Em `index.html`, criar a estrutura visual do chat (área de mensagens, campo de input, botão de enviar).
2.  **Estilização CSS:** Em `style.css`, estilizar todos os elementos para que a interface pareça um aplicativo de chat completo, porém estático.
3.  **Commit:** Realizar o commit da UI estática finalizada.

### Fase 3: Lógica Central da API (Backend - Rust)

1.  **Adicionar Dependências:** Em `/src-tauri/Cargo.toml`, adicionar `reqwest`, `serde`, `serde_json` e `tokio`.
2.  **Implementar Função de API:** Em `main.rs`, criar uma função Rust que receba um prompt, se comunique com a API da OpenAI e retorne o texto da resposta. A chave da API pode ser fixada no código ("hardcoded") nesta fase para testes.
3.  **Commit:** Realizar o commit da lógica de backend funcional e isolada.

### Fase 4: Conexão Front-end <> Backend

1.  **Criar Comando Tauri:** Em `main.rs`, expor a função de API como um `#[tauri::command]`.
2.  **Chamar Comando via JS:** Em `main.js`, adicionar um evento ao botão "Enviar" que invoca o comando Rust com o texto do input e exibe a resposta no console (`console.log`).
3.  **Commit:** Realizar o commit da conexão funcional entre as duas camadas.

### Fase 5: Renderização Dinâmica e Markdown (Front-end)

1.  **Adicionar Marked.js:** Instalar via `npm install marked`.
2.  **Renderizar Mensagens:** Em `main.js`, modificar a lógica para, ao receber a resposta do `invoke`:
    * Criar e adicionar dinamicamente os balões de mensagem do usuário e da IA na tela.
    * Processar a resposta da IA com `marked.parse()` antes de exibi-la.
    * Limpar o campo de input e rolar a tela para a última mensagem.
3.  **Commit:** Realizar o commit da interface de chat totalmente funcional.

### Fase 6: Finalização e Configuração

1.  **Gerenciamento da Chave de API:** Implementar a UI para o usuário inserir sua chave e criar os comandos Tauri para salvá-la e lê-la de um arquivo de configuração local.
2.  **Polimento:** Adicionar tratamento de erros e indicadores de carregamento.
3.  **Commit:** Realizar o commit das funcionalidades de configuração final.

### Fase 7: Build e Distribuição

1.  **Gerar Executável:** Executar `npm run tauri build`.
2.  **Teste Final:** Testar o arquivo `.exe` gerado na pasta `/src-tauri/target/release/` em uma máquina Windows sem o ambiente de desenvolvimento para validar a portabilidade.

---

## 6. Setup e Build (Resumo dos Comandos)

### a. Ambiente de Desenvolvimento

1.  **Pré-requisitos:** Instalar **Rust** e dependências do Tauri.
2.  **Inicializar o projeto:** `npm create tauri-app@latest`
3.  **Adicionar dependências (Rust):** Editar `/src-tauri/Cargo.toml`.
    ```toml
    [dependencies]
    serde = { version = "1.0", features = ["derive"] }
    serde_json = "1.0"
    reqwest = { version = "0.11", features = ["json"] }
    tokio = { version = "1", features = ["full"] }
    tauri = { version = "1.6", features = ["shell-open"] }
    ```
4.  **Executar em modo de desenvolvimento:** `npm run tauri dev`

### b. Empacotamento para Distribuição

1.  **Gerar o executável:** `npm run tauri build`
2.  **Resultado:** Um único e portátil arquivo `.exe` será gerado em `/src-tauri/target/release/`.
