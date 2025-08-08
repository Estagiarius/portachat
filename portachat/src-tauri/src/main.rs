#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

// --- Data Structures for OpenAI API ---
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

// --- Configuration Management ---
#[derive(Serialize, Deserialize, Default)]
struct AppConfig {
    api_key: Option<String>,
}

// Helper function to get the path to the config file.
fn get_config_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let config_dir = app_handle.path()
        .app_config_dir()
        .expect("failed to get app config dir");

    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).expect("failed to create config dir");
    }
    config_dir.join("settings.json")
}

// --- Tauri Commands ---

#[tauri::command]
fn save_api_key(key: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let config_path = get_config_path(&app_handle);
    let config = AppConfig { api_key: Some(key) };
    let json_string = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, json_string).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_api_key(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    let config_path = get_config_path(&app_handle);
    if !config_path.exists() {
        return Ok(None);
    }
    let json_string = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let config: AppConfig = serde_json::from_str(&json_string).map_err(|e| e.to_string())?;
    Ok(config.api_key)
}

#[tauri::command]
async fn send_openai_request(prompt: String, app_handle: tauri::AppHandle) -> Result<String, String> {
    let api_key = load_api_key(app_handle.clone())?
        .ok_or_else(|| "A chave da API não foi configurada. Por favor, adicione a chave nas configurações.".to_string())?;

    let client = reqwest::Client::new();

    let request_body = OpenAIRequest {
        model: "gpt-3.5-turbo".to_string(),
        messages: vec![Message { role: "user".to_string(), content: prompt }],
    };

    let res = client.post("https://api.openai.com/v1/chat/completions")
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
        .invoke_handler(tauri::generate_handler![
            send_openai_request,
            save_api_key,
            load_api_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
