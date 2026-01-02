use tauri::menu::{IconMenuItemBuilder, MenuItemKind, NativeIcon};
use tauri::{AppHandle, Runtime};

/// Creates a menu item for a context menu, optionally with a native icon.
pub fn create_context_menu_item<R: Runtime>(
    app: &AppHandle<R>,
    id: &str,
    text: &str,
    icon_type: Option<&str>,
) -> tauri::Result<MenuItemKind<R>> {
    use tauri::menu::MenuItemBuilder;

    let native_icon = match icon_type {
        Some("trash") => Some(NativeIcon::TrashEmpty),
        // Some("duplicate") => Some(NativeIcon::Copy), // Not available in standard list mostly
        _ => None,
    };

    if let Some(native) = native_icon {
        let item = IconMenuItemBuilder::with_id(id, text)
            .native_icon(native)
            .build(app)?;
        Ok(MenuItemKind::Icon(item))
    } else {
        let item = MenuItemBuilder::with_id(id, text).build(app)?;
        Ok(MenuItemKind::MenuItem(item))
    }
}
/// Centralized handler for menu events. Maps menu IDs to frontend actions
/// and emits a `context-menu-action` event.
pub fn handle_menu_event<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    event: tauri::menu::MenuEvent,
) {
    use crate::constants::*;
    use tauri::Manager;
    use tauri_specta::Event;

    let id = event.id.as_ref();
    let action = match id {
        id if id == MENU_ID_RENAME => ContextMenuAction::Rename,
        id if id == MENU_ID_DUPLICATE => ContextMenuAction::Duplicate,
        id if id == MENU_ID_TRASH => ContextMenuAction::Trash,
        id if id == MENU_ID_ADD_FAVORITE => ContextMenuAction::AddFavorite,
        id if id == MENU_ID_REMOVE_FAVORITE => ContextMenuAction::RemoveFavorite,
        _ => return,
    };

    let state = app.state::<crate::core::state::AppState>();
    if let Some(path) = state.get_context_menu_path() {
        let _ = ContextMenuPayload { action, path }.emit(app);
    }
}
