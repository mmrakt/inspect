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
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            app.on_menu_event(|app, event| {
                let id = event.id.as_ref();
                if id == "context_rename" || id == "context_duplicate" || id == "context_trash" {
                    use tauri::{Emitter, Manager};
                    let state = app.state::<core::state::AppState>();
                    if let Some(path) = state.get_context_menu_path() {
                        let action = match id {
                            "context_rename" => "rename",
                            "context_duplicate" => "duplicate",
                            "context_trash" => "trash",
                            _ => "",
                        };
                        let _ = app.emit(
                            "context-menu-action",
                            serde_json::json!({
                                "action": action,
                                "path": path
                            }),
                        );
                    }
                }
            });
            Ok(())
        })
        .manage(core::state::AppState::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::fs::scan_directory,
            commands::fs::search_files,
            commands::fs::search_content,
            commands::fs::move_entries,
            commands::fs::open_app,
            commands::fs::get_app_icon,
            commands::fs::rename_entry,
            commands::fs::duplicate_entry,
            commands::fs::move_to_trash,
            commands::fs::show_context_menu,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
