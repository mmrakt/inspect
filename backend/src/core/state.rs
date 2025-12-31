use crate::core::scanner::FileEntry;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct AppState {
    pub files: Mutex<HashMap<PathBuf, FileEntry>>,
    pub context_menu_path: Mutex<Option<String>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            files: Mutex::new(HashMap::new()),
            context_menu_path: Mutex::new(None),
        }
    }

    pub fn update_files(&self, new_entries: Vec<FileEntry>) {
        let mut files = self.files.lock().unwrap();
        files.clear();
        for entry in new_entries {
            files.insert(entry.path.clone(), entry);
        }
    }

    pub fn set_context_menu_path(&self, path: Option<String>) {
        let mut p = self.context_menu_path.lock().unwrap();
        *p = path;
    }

    pub fn get_context_menu_path(&self) -> Option<String> {
        self.context_menu_path.lock().unwrap().clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::scanner::FileMetadata;

    #[test]
    fn test_update_files() {
        let state = AppState::new();
        let entry = FileEntry {
            name: "test.txt".to_string(),
            path: PathBuf::from("test.txt"),
            metadata: FileMetadata {
                size: 100,
                mtime: None,
                is_dir: false,
                is_app: false,
            },
        };

        state.update_files(vec![entry]);

        let files = state.files.lock().unwrap();
        assert_eq!(files.len(), 1);
        assert_eq!(
            files.get(&PathBuf::from("test.txt")).unwrap().name,
            "test.txt"
        );
    }
}
