use std::path::Path;

/// Extracts the icon from an application file (e.g., .app on macOS).
#[tauri::command]
#[specta::specta]
pub async fn get_app_icon(path: String) -> Result<String, String> {
    use crate::utils::icon::extract_app_icon;
    extract_app_icon(Path::new(&path)).map_err(|e| e.to_string())
}
