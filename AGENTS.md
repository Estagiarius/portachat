# Prompt para Agente de IA: Desenvolvimento do Chat Desktop com Tauri

## Objetivo

Sua tarefa é desenvolver uma aplicação de desktop para Windows, leve e de alta performance, que funcione como um cliente de chat para a API da OpenAI. Você deve seguir estritamente o plano de implementação em cascata detalhado abaixo, gerando o código para cada arquivo em cada fase.

## Tecnologias Mandatórias

* **Framework:** Tauri
* **Backend:** Rust
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **Renderização de Markdown:** Biblioteca `Marked.js`
* **Requisições HTTP (Rust):** Crate `reqwest`

---

## Plano de Implementação e Ações Requeridas

### Fase 1: Configuração do Ambiente e Estrutura do Projeto

1.  **Ação:** Execute os comandos no terminal para criar um novo projeto Tauri.
    ```bash
    npm create tauri-app@latest -- --template vanilla -y
    cd meu-chat-app
    ```
2.  **Ação:** Valide a instalação.
    ```bash
    npm run tauri dev
    ```
    *Confirme que uma janela vazia é exibida e feche-a para continuar.*

### Fase 2: Desenvolvimento da Interface Estática (Front-end)

1.  **Ação:** Substitua o conteúdo do arquivo `src/index.html` pelo seguinte código:
    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="style.css" />
        <title>TauriChat</title>
    </head>
    <body>
        <div class="chat-container">
            <div class="chat-messages" id="chat-messages">
                <!-- Mensagens serão inseridas aqui -->
            </div>
            <div class="chat-input-form">
                <textarea id="message-input" placeholder="Digite sua mensagem..."></textarea>
                <button id="send-button">Enviar</button>
            </div>
        </div>
        <script type="module" src="/main.js"></script>
    </body>
    </html>
    ```
2.  **Ação:** Substitua o conteúdo do arquivo `src/style.css` pelo seguinte código:
    ```css
    /* Estilos gerais */
    body, html { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f0f2f5; height: 100%; }
    .chat-container { display: flex; flex-direction: column; height: 100vh; }

    /* Área de Mensagens */
    .chat-messages { flex: 1; overflow-y: auto; padding: 20px; }
    .message { max-width: 70%; margin-bottom: 15px; padding: 10px 15px; border-radius: 18px; line-height: 1.4; }
    .user-message { background-color: #0084ff; color: white; align-self: flex-end; margin-left: auto; }
    .ai-message { background-color: #e4e6eb; color: #050505; align-self: flex-start; }
    .ai-message pre { background-color: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 8px; overflow-x: auto; }
    .ai-message code { font-family: "Courier New", Courier, monospace; }

    /* Formulário de Input */
    .chat-input-form { display: flex; padding: 10px; border-top: 1px solid #ddd; background-color: #fff; }
    textarea { flex: 1; resize: none; border: 1px solid #ccc; border-radius: 18px; padding: 10px; font-size: 16px; max-height: 100px; }
    button { background-color: #0084ff; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; margin-left: 10px; cursor: pointer; font-size: 20px; }
    button:hover { background-color: #0073e6; }
    ```

### Fase 3: Lógica Central da API (Backend - Rust)

1.  **Ação:** Adicione as dependências ao arquivo `src-tauri/Cargo.toml`.
    ```toml
    [dependencies]
    serde = { version = "1.0", features = ["derive"] }
    serde_json = "1.0"
    reqwest = { version = "0.11", features = ["json"] }
    tokio = { version = "1", features = ["full"] }
    tauri = { version = "1.6", features = ["shell-open"] }
    ```
2.  **Ação:** Substitua o conteúdo de `src-tauri/src/main.rs` pelo código abaixo. **Ainda não adicione a lógica de invoke**.
    ```rust
    // Prevents additional console window on Windows in release, DO NOT REMOVE!!
    #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

    // Aqui será a lógica do backend

    fn main() {
        tauri::Builder::default()
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
    ```

### Fase 4: Conexão Front-end <> Backend

1.  **Ação:** Modifique `src-tauri/src/main.rs` para adicionar o comando `send_openai_request`.
    ```rust
    #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

    use serde::{Deserialize, Serialize};

    #[derive(Serialize, Deserialize)]
    struct OpenAIRequest {
        model: String,
        messages: Vec<Message>,
    }

    #[derive(Serialize, Deserialize, Clone)]
    struct Message {
        role: String,
        content: String,
    }

    #[derive(Serialize, Deserialize)]
    struct OpenAIResponse {
        choices: Vec<Choice>,
    }

    #[derive(Serialize, Deserialize)]
    struct Choice {
        message: Message,
    }

    #[tauri::command]
    async fn send_openai_request(prompt: String) -> Result<String, String> {
        let api_key = "SUA_CHAVE_API_AQUI"; // ATENÇÃO: Substituir pela chave real para teste
        let client = reqwest::Client::new();

        let request_body = OpenAIRequest {
            model: "gpt-3.5-turbo".to_string(),
            messages: vec![Message { role: "user".to_string(), content: prompt }],
        };

        let res = client.post("[https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)")
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&request_body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if res.status().is_success() {
            let response_data: OpenAIResponse = res.json().await.map_err(|e| e.to_string())?;
            if let Some(choice) = response_data.choices.get(0) {
                Ok(choice.message.content.clone())
            } else {
                Err("Nenhuma resposta da IA.".to_string())
            }
        } else {
            let error_body = res.text().await.map_err(|e| e.to_string())?;
            Err(format!("Erro da API: {}", error_body))
        }
    }

    fn main() {
        tauri::Builder::default()
            .invoke_handler(tauri::generate_handler![send_openai_request])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
    ```
2.  **Ação:** Substitua o conteúdo de `src/main.js` para invocar o comando.
    ```javascript
    const { invoke } = window.__TAURI__.tauri;

    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    async function sendMessage() {
        const prompt = messageInput.value;
        if (!prompt) return;

        console.log(`Enviando: ${prompt}`);
        try {
            const response = await invoke('send_openai_request', { prompt });
            console.log(`Recebido: ${response}`);
        } catch (error) {
            console.error('Erro ao chamar o backend:', error);
        }
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    ```

### Fase 5: Renderização Dinâmica e Markdown (Front-end)

1.  **Ação:** Instale a biblioteca `marked`.
    ```bash
    npm install marked
    ```
2.  **Ação:** Modifique `src/main.js` para renderizar as mensagens.
    ```javascript
    import { invoke } from '[https://cdn.jsdelivr.net/npm/@tauri-apps/api/tauri.js](https://cdn.jsdelivr.net/npm/@tauri-apps/api/tauri.js)';
    import { marked } from '[https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js](https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js)';

    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');

    function addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${type}-message`);
        if (type === 'ai') {
            messageDiv.innerHTML = marked.parse(content);
        } else {
            messageDiv.textContent = content;
        }
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleSend() {
        const prompt = messageInput.value.trim();
        if (!prompt) return;

        addMessage(prompt, 'user');
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;

        try {
            const response = await invoke('send_openai_request', { prompt });
            addMessage(response, 'ai');
        } catch (error) {
            addMessage(`Erro: ${error}`, 'ai');
        } finally {
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    }

    sendButton.addEventListener('click', handleSend);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    ```

### Fase 6 e 7: Finalização e Build

1.  **Ação (Opcional):** Implemente a lógica de salvamento e leitura da chave de API.
2.  **Ação Final:** Execute o comando de build para gerar o executável.
    ```bash
    npm run tauri build
    ```

*Fim das instruções. O agente deve agora executar essas ações em sequência.*
