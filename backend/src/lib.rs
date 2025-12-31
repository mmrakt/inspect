// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

mod commands;
mod core;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(core::state::AppState::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::fs::scan_directory,
            commands::fs::search_files,
            commands::fs::search_content,
            commands::fs::move_entries,
            commands::fs::open_app,
            commands::fs::get_app_icon,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
