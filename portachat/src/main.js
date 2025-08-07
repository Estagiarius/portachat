import { invoke } from 'https://cdn.jsdelivr.net/npm/@tauri-apps/api/tauri.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

// Chat elements
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');

// Settings modal elements
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyButton = document.getElementById('save-api-key-button');
const closeModalButton = document.getElementById('close-modal-button');

// --- Functions ---

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

function openSettingsModal() {
    settingsModal.style.display = 'flex';
}

function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert('Por favor, insira uma chave de API.');
        return;
    }
    try {
        await invoke('save_api_key', { key: apiKey });
        alert('Chave de API salva com sucesso!');
        closeSettingsModal();
        addMessage('Sua chave de API foi salva. Agora você pode iniciar a conversa!', 'ai');
    } catch (error) {
        alert(`Erro ao salvar a chave: ${error}`);
    }
}

async function checkApiKey() {
    try {
        const apiKey = await invoke('load_api_key');
        if (!apiKey) {
            addMessage('Bem-vindo! Parece que você ainda não configurou sua chave de API da OpenAI. Clique no ícone de engrenagem ⚙️ no canto superior direito para começar.', 'ai');
            openSettingsModal();
        } else {
             addMessage('Chave de API carregada. Pronto para conversar!', 'ai');
        }
    } catch (error) {
        addMessage(`Erro ao carregar a chave de API: ${error}`, 'ai');
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

settingsButton.addEventListener('click', openSettingsModal);
closeModalButton.addEventListener('click', closeSettingsModal);
saveApiKeyButton.addEventListener('click', saveApiKey);

// --- App Initialization ---
checkApiKey();
