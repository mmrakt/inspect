use crate::core::content_searcher::{ContentSearcher, SearchResult};
use crate::core::scanner::{FileEntry, Scanner};
use crate::core::searcher::Searcher;
use crate::core::state::AppState;
use anyhow::Result;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::State;

#[tauri::command]
pub async fn scan_directory(
    path: String,
    recursive: bool,
    show_hidden: bool,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    let mut scanner = Scanner::new(&path).with_show_hidden(show_hidden);
    if !recursive {
        scanner = scanner.with_max_depth(1);
    }
    let entries = scanner.scan().map_err(|e| e.to_string())?;
    let count = entries.len();
    state.update_files(entries);
    Ok(count)
}

#[tauri::command]
pub async fn search_files(
    query: String,
    state: State<'_, AppState>,
) -> Result<Vec<FileEntry>, String> {
    let files = state.files.lock().unwrap();
    let results = Searcher::search_filenames(&files, &query);
    Ok(results)
}

#[tauri::command]
pub async fn search_content(query: String, path: String) -> Result<Vec<SearchResult>, String> {
    // This is a simple implementation that searches a single path or directory.
    // In a real scenario, we might want to parallelize this across multiple files.
    let mut results = Vec::new();
    let p = Path::new(&path);
    if p.is_file() {
        if let Some(res) = ContentSearcher::search_file(p, &query).map_err(|e| e.to_string())? {
            results.push(res);
        }
    } else {
        // For directories, we can use our Scanner to get all files first, or just use WalkDir again.
        // For now, let's keep it simple.
        let scanner = Scanner::new(p);
        let entries = scanner.scan().map_err(|e| e.to_string())?;
        for entry in entries {
            if !entry.metadata.is_dir {
                if let Ok(Some(res)) = ContentSearcher::search_file(&entry.path, &query) {
                    results.push(res);
                }
            }
        }
    }
    Ok(results)
}

fn move_entries_impl(paths: &[PathBuf], target_dir: &Path) -> Result<Vec<PathBuf>, String> {
    if !target_dir.is_dir() {
        return Err("Target directory does not exist".to_string());
    }

    let mut moved = Vec::new();
    for source in paths {
        let file_name = source
            .file_name()
            .ok_or_else(|| "Invalid source path".to_string())?;
        let destination = target_dir.join(file_name);
        if destination.exists() {
            return Err(format!("Target already exists: {}", destination.display()));
        }
        fs::rename(source, &destination).map_err(|e| e.to_string())?;
        moved.push(destination);
    }

    Ok(moved)
}

#[tauri::command]
pub async fn move_entries(paths: Vec<String>, target_dir: String) -> Result<Vec<String>, String> {
    let sources: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
    let target = PathBuf::from(target_dir);
    let moved = move_entries_impl(&sources, &target)?;
    Ok(moved
        .into_iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect())
}
#[tauri::command]
pub async fn open_app(path: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app_handle
        .opener()
        .open_path(path, None::<String>)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_app_icon(path: String) -> Result<String, String> {
    use crate::utils::icon::extract_app_icon;
    extract_app_icon(Path::new(&path)).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn rename_entry(path: String, new_name: String) -> Result<(), String> {
    let source = PathBuf::from(&path);
    let parent = source.parent().ok_or("Invalid path")?;
    let destination = parent.join(new_name);

    if destination.exists() {
        // Return a specific error message that frontend can match
        return Err("Target already exists".to_string());
    }

    fs::rename(source, destination).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn duplicate_entry(path: String) -> Result<String, String> {
    let source = PathBuf::from(&path);
    let parent = source.parent().ok_or("Invalid path")?;
    let _file_name = source.file_name().ok_or("Invalid path")?.to_string_lossy();
    let ext = source.extension().map(|e| e.to_string_lossy().to_string());
    let stem = source.file_stem().ok_or("Invalid path")?.to_string_lossy();

    let (base_stem, start_counter) = {
        let re = regex::Regex::new(r"^(.*) copy(?: (\d+))?$").unwrap();
        if let Some(caps) = re.captures(&stem) {
            let base = caps.get(1).map_or("", |m| m.as_str()).to_string();
            let count = caps
                .get(2)
                .map_or(1, |m| m.as_str().parse::<i32>().unwrap_or(1));
            (base, count)
        } else {
            (stem.to_string(), 0)
        }
    };

    let mut new_name;
    let mut destination;
    let mut counter = start_counter;

    // If it was "foo", start_counter is 0. Next is "foo copy" (implies 1 but no number).
    // If it was "foo copy", start_counter is 1. Next should be "foo copy 2".

    loop {
        if counter == 0 {
            new_name = format!("{} copy", base_stem);
            counter = 1;
        } else {
            // If we just became 1 from 0, and "foo copy" exists, next loop `counter` will be 1 (incremented at end of loop? No, logic above)
            // Let's restructure loop efficiently.
            counter += 1;
            new_name = format!("{} copy {}", base_stem, counter);
        }

        if let Some(ref e) = ext {
            new_name = format!("{}.{}", new_name, e);
        }
        destination = parent.join(&new_name);

        if !destination.exists() {
            break;
        }
    }

    if source.is_dir() {
        copy_recursively(&source, &destination).map_err(|e| e.to_string())?;
    } else {
        fs::copy(&source, &destination).map_err(|e| e.to_string())?;
    }

    Ok(destination.to_string_lossy().to_string())
}

fn copy_recursively(source: &Path, user_destination: &Path) -> std::io::Result<()> {
    fs::create_dir_all(user_destination)?;
    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            copy_recursively(&entry.path(), &user_destination.join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), user_destination.join(entry.file_name()))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn move_to_trash(path: String) -> Result<(), String> {
    trash::delete(path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn show_context_menu(
    app: tauri::AppHandle,
    path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    use tauri::menu::ContextMenu;
    use tauri::menu::Menu;
    use tauri::Manager;

    // Store path in state
    state.set_context_menu_path(Some(path));

    let rename = crate::utils::menu::create_context_menu_item(
        &app,
        "context_rename",
        "Rename",
        Some("rename"),
    )
    .map_err(|e| e.to_string())?;

    let duplicate = crate::utils::menu::create_context_menu_item(
        &app,
        "context_duplicate",
        "Duplicate",
        Some("duplicate"),
    )
    .map_err(|e| e.to_string())?;

    let trash = crate::utils::menu::create_context_menu_item(
        &app,
        "context_trash",
        "Move to Trash",
        Some("trash"),
    )
    .map_err(|e| e.to_string())?;

    let menu = Menu::with_items(
        &app,
        &[
            &rename,
            &duplicate,
            &tauri::menu::PredefinedMenuItem::separator(&app).map_err(|e| e.to_string())?,
            &trash,
        ],
    )
    .map_err(|e| e.to_string())?;

    if let Some(window) = app.get_webview_window("main") {
        menu.popup(window.as_ref().window())
            .map_err(|e| e.to_string())?;
    } else {
        return Err("No main window".to_string());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::move_entries_impl;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn move_entries_moves_files() {
        let source_dir = tempdir().unwrap();
        let target_dir = tempdir().unwrap();

        let file_a = source_dir.path().join("a.txt");
        let file_b = source_dir.path().join("b.txt");
        fs::write(&file_a, "a").unwrap();
        fs::write(&file_b, "b").unwrap();

        let moved =
            move_entries_impl(&[file_a.clone(), file_b.clone()], target_dir.path()).unwrap();

        assert_eq!(moved.len(), 2);
        assert!(!file_a.exists());
        assert!(!file_b.exists());
        assert!(target_dir.path().join("a.txt").exists());
        assert!(target_dir.path().join("b.txt").exists());
    }

    #[test]
    fn move_entries_rejects_existing_target() {
        let source_dir = tempdir().unwrap();
        let target_dir = tempdir().unwrap();

        let file_a = source_dir.path().join("a.txt");
        fs::write(&file_a, "a").unwrap();
        fs::write(target_dir.path().join("a.txt"), "existing").unwrap();

        let err = move_entries_impl(&[file_a], target_dir.path()).unwrap_err();
        assert!(err.contains("Target already exists"));
    }
}
