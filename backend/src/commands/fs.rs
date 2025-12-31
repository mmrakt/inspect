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
            return Err(format!(
                "Target already exists: {}",
                destination.display()
            ));
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

        let moved = move_entries_impl(
            &[file_a.clone(), file_b.clone()],
            target_dir.path(),
        )
        .unwrap();

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
