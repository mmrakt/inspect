use tauri::menu::{IconMenuItemBuilder, MenuItemKind, NativeIcon};
use tauri::{AppHandle, Runtime};

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
