import { invoke } from '@tauri-apps/api/core';
import { marked } from 'marked';

// --- DOM Elements ---
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyButton = document.getElementById('save-key-button');
const keyStatus = document.getElementById('key-status');

// --- Functions ---

/**
 * Adds a message to the chat window.
 * @param {string} content The message content.
 * @param {'user' | 'ai'} type The type of message.
 */
function addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${type}-message`);

    // Sanitize and parse Markdown for AI messages
    if (type === 'ai') {
        messageDiv.innerHTML = marked.parse(content, { sanitize: true });
    } else {
        messageDiv.textContent = content;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Handles sending a message to the backend.
 */
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

/**
 * Saves the API key.
 */
async function saveKey() {
    const key = apiKeyInput.value.trim();
    if (!key) {
        keyStatus.textContent = 'A chave não pode estar vazia.';
        return;
    }

    try {
        await invoke('save_api_key', { key });
        keyStatus.textContent = 'Chave salva com sucesso!';
        apiKeyInput.value = '';
        setTimeout(() => {
            keyStatus.textContent = 'Chave configurada.';
        }, 2000);
    } catch (error) {
        keyStatus.textContent = `Erro ao salvar a chave: ${error}`;
    }
}

/**
 * Loads the API key on startup and updates the status.
 */
async function checkApiKey() {
    try {
        const key = await invoke('load_api_key');
        if (key) {
            keyStatus.textContent = 'Chave configurada.';
        } else {
            keyStatus.textContent = 'Chave da API não configurada.';
        }
    } catch (error) {
        keyStatus.textContent = 'Erro ao carregar a chave.';
    }
}

// --- Event Listeners ---

sendButton.addEventListener('click', handleSend);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
});

saveKeyButton.addEventListener('click', saveKey);

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    checkApiKey();
});
