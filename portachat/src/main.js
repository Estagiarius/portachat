import { invoke } from 'https://cdn.jsdelivr.net/npm/@tauri-apps/api/tauri.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

// --- Elementos do DOM ---
const campoMensagem = document.getElementById('message-input');
const botaoEnviar = document.getElementById('send-button');
const areaMensagens = document.getElementById('chat-messages');
const modalConfig = document.getElementById('settings-modal');
const botaoConfig = document.getElementById('settings-button');
const botaoFecharModal = document.querySelector('.close-button');
const campoChaveApi = document.getElementById('api-key-input');
const botaoSalvarChave = document.getElementById('save-api-key-button');

// --- Funções de UI ---
function adicionarMensagem(conteudo, tipo) {
    // Remove o indicador de "digitando" se existir
    const indicadorDigitando = document.getElementById('typing-indicator');
    if (indicadorDigitando) {
        indicadorDigitando.remove();
    }

    const divMensagem = document.createElement('div');
    divMensagem.classList.add('message', `${tipo}-message`);
    if (tipo === 'ai') {
        divMensagem.innerHTML = marked.parse(conteudo);
    } else {
        divMensagem.textContent = conteudo;
    }
    areaMensagens.appendChild(divMensagem);
    areaMensagens.scrollTop = areaMensagens.scrollHeight;
}

function mostrarIndicadorDigitando() {
    const divIndicador = document.createElement('div');
    divIndicador.id = 'typing-indicator';
    divIndicador.classList.add('message', 'ai-message');
    divIndicador.textContent = 'Digitando...';
    areaMensagens.appendChild(divIndicador);
    areaMensagens.scrollTop = areaMensagens.scrollHeight;
}

// --- Lógica Principal do Chat ---
async function processarEnvio() {
    const prompt = campoMensagem.value.trim();
    if (!prompt) return;

    adicionarMensagem(prompt, 'user');
    campoMensagem.value = '';
    campoMensagem.disabled = true;
    botaoEnviar.disabled = true;
    mostrarIndicadorDigitando();

    try {
        const resposta = await invoke('enviar_requisicao_openai', { prompt });
        adicionarMensagem(resposta, 'ai');
    } catch (erro) {
        // Personaliza a mensagem de erro para o usuário
        if (erro.includes("Chave da API não encontrada")) {
            erro = "A chave da API da OpenAI não foi configurada. Por favor, clique no ícone de engrenagem ⚙️ para inseri-la.";
        }
        adicionarMensagem(`Erro: ${erro}`, 'ai');
    } finally {
        campoMensagem.disabled = false;
        botaoEnviar.disabled = false;
        campoMensagem.focus();
    }
}

// --- Lógica do Modal e Chave de API ---
function abrirModal() {
    // Carrega a chave salva (se existir) para mostrar ao usuário
    invoke('carregar_chave_api')
        .then(chave => {
            campoChaveApi.value = chave;
        })
        .catch(() => {
            campoChaveApi.value = ''; // Limpa se não encontrar a chave
        });
    modalConfig.style.display = 'block';
}

function fecharModal() {
    modalConfig.style.display = 'none';
}

async function salvarChave() {
    const chave = campoChaveApi.value.trim();
    if (!chave) {
        alert("Por favor, insira uma chave de API.");
        return;
    }
    try {
        await invoke('salvar_chave_api', { chave });
        alert("Chave da API salva com sucesso!");
        fecharModal();
    } catch (erro) {
        alert(`Falha ao salvar a chave: ${erro}`);
    }
}

// --- Event Listeners ---
botaoEnviar.addEventListener('click', processarEnvio);
campoMensagem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        processarEnvio();
    }
});

botaoConfig.addEventListener('click', abrirModal);
botaoFecharModal.addEventListener('click', fecharModal);
botaoSalvarChave.addEventListener('click', salvarChave);

// Fecha o modal se o usuário clicar fora do conteúdo
window.onclick = function(event) {
    if (event.target == modalConfig) {
        fecharModal();
    }
}

// Verifica se a chave existe ao iniciar e avisa o usuário se não existir.
window.addEventListener('DOMContentLoaded', () => {
  invoke('carregar_chave_api').catch(() => {
    adicionarMensagem("Bem-vindo! Parece que você ainda não configurou sua chave da API da OpenAI. Clique no ícone de engrenagem ⚙️ no canto superior para começar.", "ai");
  });
});
