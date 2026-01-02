use serde::Serialize;
use tauri_specta::Event;

// Menu IDs
pub const MENU_ID_RENAME: &str = "context_rename";
pub const MENU_ID_DUPLICATE: &str = "context_duplicate";
pub const MENU_ID_TRASH: &str = "context_trash";
pub const MENU_ID_ADD_FAVORITE: &str = "context_add_favorite";
pub const MENU_ID_REMOVE_FAVORITE: &str = "context_remove_favorite";

// Event Names
#[derive(specta::Type, Serialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum ContextMenuAction {
    Rename,
    Duplicate,
    Trash,
    AddFavorite,
    RemoveFavorite,
}

#[derive(specta::Type, Serialize, Clone, Debug, Event)]
pub struct ContextMenuPayload {
    pub action: ContextMenuAction,
    pub path: String,
}
