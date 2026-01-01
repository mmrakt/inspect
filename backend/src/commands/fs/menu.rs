use crate::constants::*;
use crate::core::state::AppState;
use tauri::State;

/// Displays a native context menu for a specific file system entry.
/// The menu includes Rename, Duplicate, Move to Trash, and Add to Favorites (for directories).
#[tauri::command]
#[specta::specta]
pub async fn show_context_menu(
    app: tauri::AppHandle,
    path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    use tauri::menu::ContextMenu;
    use tauri::menu::Menu;
    use tauri::Manager;

    // Store path in state
    state.set_context_menu_path(Some(path.clone()));

    let rename = crate::utils::menu::create_context_menu_item(
        &app,
        MENU_ID_RENAME,
        "Rename",
        Some("rename"),
    )
    .map_err(|e| e.to_string())?;

    let duplicate = crate::utils::menu::create_context_menu_item(
        &app,
        MENU_ID_DUPLICATE,
        "Duplicate",
        Some("duplicate"),
    )
    .map_err(|e| e.to_string())?;

    let trash = crate::utils::menu::create_context_menu_item(
        &app,
        MENU_ID_TRASH,
        "Move to Trash",
        Some("trash"),
    )
    .map_err(|e| e.to_string())?;

    let mut items: Vec<&dyn tauri::menu::IsMenuItem<_>> = vec![&rename, &duplicate];

    let is_dir = std::path::Path::new(&path).is_dir();
    let add_favorite = if is_dir {
        let item = crate::utils::menu::create_context_menu_item(
            &app,
            MENU_ID_ADD_FAVORITE,
            "Add to Favorites",
            None,
        )
        .map_err(|e| e.to_string())?;
        Some(item)
    } else {
        None
    };

    if let Some(ref item) = add_favorite {
        items.push(item);
    }

    let separator = tauri::menu::PredefinedMenuItem::separator(&app).map_err(|e| e.to_string())?;
    items.push(&separator);
    items.push(&trash);

    let menu = Menu::with_items(&app, &items).map_err(|e| e.to_string())?;

    if let Some(window) = app.get_webview_window("main") {
        menu.popup(window.as_ref().window())
            .map_err(|e| e.to_string())?;
    } else {
        return Err("No main window".to_string());
    }

    Ok(())
}
