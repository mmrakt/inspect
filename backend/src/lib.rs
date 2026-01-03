mod commands;
mod constants;
mod core;
mod utils;

/// The main entry point for the backend application.
/// Sets up plugins, menu handlers, state, and command handlers.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use commands::fs::*;

    macro_rules! commands {
        () => {
            tauri_specta::collect_commands![
                scan_directory,
                search_files,
                search_content,
                move_entries,
                open_app,
                get_app_icon,
                rename_entry,
                duplicate_entry,
                move_to_trash,
                show_context_menu,
            ]
        };
    }

    macro_rules! events {
        () => {
            tauri_specta::collect_events![crate::constants::ContextMenuPayload]
        };
    }

    let specta_builder = tauri_specta::Builder::<tauri::Wry>::new()
        .commands(commands!())
        .events(events!());

    #[cfg(debug_assertions)]
    {
        use specta_typescript::Typescript;
        specta_builder
            .export(
                Typescript::default()
                    .bigint(specta_typescript::BigIntExportBehavior::Number)
                    // Suppress TS errors in generated file: https://github.com/specta-rs/tauri-specta/issues/190
                    .header("// @ts-nocheck\n"),
                "../frontend/shared/lib/specta/__generated__/index.ts",
            )
            .expect("Failed to export specta bindings");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(specta_builder.invoke_handler())
        .setup(move |app| {
            specta_builder.mount_events(app);
            app.on_menu_event(|app, event| {
                crate::utils::menu::handle_menu_event(app, event);
            });
            Ok(())
        })
        .manage(core::state::AppState::new())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use specta_typescript::Typescript;

    #[test]
    fn test_export_bindings() {
        use crate::commands::fs::*;
        macro_rules! commands {
            () => {
                tauri_specta::collect_commands![
                    scan_directory,
                    search_files,
                    search_content,
                    move_entries,
                    open_app,
                    get_app_icon,
                    rename_entry,
                    duplicate_entry,
                    move_to_trash,
                    show_context_menu,
                ]
            };
        }

        macro_rules! events {
            () => {
                tauri_specta::collect_events![crate::constants::ContextMenuPayload]
            };
        }

        let specta_builder = tauri_specta::Builder::<tauri::Wry>::new()
            .commands(commands!())
            .events(events!());

        specta_builder
            .export(
                Typescript::default()
                    .bigint(specta_typescript::BigIntExportBehavior::Number)
                    // Suppress TS errors in generated file: https://github.com/specta-rs/tauri-specta/issues/190
                    .header("// @ts-nocheck\n"),
                "../frontend/shared/lib/specta/__generated__/index.ts",
            )
            .expect("Failed to export specta bindings");
    }
}
