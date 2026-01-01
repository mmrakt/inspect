use crate::core::content_searcher::ContentSearcher;
use crate::core::content_searcher::SearchResult;
use crate::core::scanner::FileEntry;
use crate::core::scanner::Scanner;
use crate::core::searcher::Searcher;
use crate::core::state::AppState;
use std::path::Path;
use tauri::State;

/// Scans a directory for files and subdirectories.
/// Updates the application state with the found entries.
#[tauri::command]
#[specta::specta]
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

/// Searches for files by name in the current application state.
#[tauri::command]
#[specta::specta]
pub async fn search_files(
    query: String,
    state: State<'_, AppState>,
) -> Result<Vec<FileEntry>, String> {
    let files = state.files.lock().unwrap();
    let results = Searcher::search_filenames(&files, &query);
    Ok(results)
}

/// Searches for specific content within a file or all files in a directory.
#[tauri::command]
#[specta::specta]
pub async fn search_content(query: String, path: String) -> Result<Vec<SearchResult>, String> {
    let mut results = Vec::new();
    let p = Path::new(&path);
    if p.is_file() {
        if let Some(res) = ContentSearcher::search_file(p, &query).map_err(|e| e.to_string())? {
            results.push(res);
        }
    } else {
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
#[cfg(test)]
mod tests {
    use std::fs;
    use tempfile::tempdir;

    #[tokio::test]
    async fn search_content_finds_text() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.txt");
        fs::write(&file_path, "hello world").unwrap();

        let results =
            super::search_content("hello".to_string(), file_path.to_string_lossy().to_string())
                .await
                .unwrap();

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].matches.len(), 1);
        assert!(results[0].matches[0].line_content.contains("hello world"));
    }
}
