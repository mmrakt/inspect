use crate::core::content_searcher::{ContentSearcher, SearchResult};
use crate::core::scanner::{FileEntry, Scanner};
use crate::core::searcher::Searcher;
use crate::core::state::AppState;
use anyhow::Result;
use std::path::Path;
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
