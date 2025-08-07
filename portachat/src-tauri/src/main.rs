// Impede que uma janela de console extra apareça no Windows em modo de release, NÃO REMOVA!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tauri::Manager;
use std::fs;
use std::path::PathBuf;

// --- Estruturas para a API da OpenAI ---
#[derive(Serialize, Deserialize)]
struct RequisicaoOpenAI {
    model: String,
    messages: Vec<Mensagem>,
}

#[derive(Serialize, Deserialize, Clone)]
struct Mensagem {
    role: String,
    content: String,
}

#[derive(Serialize, Deserialize)]
struct RespostaOpenAI {
    choices: Vec<Escolha>,
}

#[derive(Serialize, Deserialize)]
struct Escolha {
    message: Mensagem,
}

// --- Funções Auxiliares para Chave ---
fn obter_caminho_chave(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let config_dir = app_handle.path().app_config_dir().ok_or("Não foi possível obter o diretório de configuração.")?;
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| format!("Falha ao criar diretório de configuração: {}", e))?;
    }
    Ok(config_dir.join("api_key.txt"))
}

// --- Comandos Tauri ---
#[tauri::command]
async fn salvar_chave_api(app_handle: tauri::AppHandle, chave: String) -> Result<(), String> {
    let caminho_chave = obter_caminho_chave(&app_handle)?;
    fs::write(caminho_chave, chave).map_err(|e| format!("Falha ao salvar a chave: {}", e))
}

#[tauri::command]
async fn carregar_chave_api(app_handle: tauri::AppHandle) -> Result<String, String> {
    let caminho_chave = obter_caminho_chave(&app_handle)?;
    fs::read_to_string(caminho_chave).map_err(|_| "Chave da API não encontrada.".to_string())
}

#[tauri::command]
async fn enviar_requisicao_openai(app_handle: tauri::AppHandle, prompt: String) -> Result<String, String> {
    let chave_api = carregar_chave_api(app_handle).await?;
    let cliente = reqwest::Client::new();

    let corpo_requisicao = RequisicaoOpenAI {
        model: "gpt-3.5-turbo".to_string(),
        messages: vec![Mensagem { role: "user".to_string(), content: prompt }],
    };

    let resposta_api = cliente.post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", chave_api))
        .json(&corpo_requisicao)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if resposta_api.status().is_success() {
        let dados_resposta: RespostaOpenAI = resposta_api.json().await.map_err(|e| e.to_string())?;
        if let Some(escolha) = dados_resposta.choices.get(0) {
            Ok(escolha.message.content.clone())
        } else {
            Err("Nenhuma resposta da IA foi recebida.".to_string())
        }
    } else {
        let corpo_erro = resposta_api.text().await.map_err(|e| e.to_string())?;
        if corpo_erro.contains("Incorrect API key") {
            Err("A chave da API fornecida é inválida. Por favor, verifique suas configurações.".to_string())
        } else {
            Err(format!("Erro da API: {}", corpo_erro))
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            enviar_requisicao_openai,
            salvar_chave_api,
            carregar_chave_api
        ])
        .run(tauri::generate_context!())
        .expect("erro ao executar a aplicação tauri");
}
