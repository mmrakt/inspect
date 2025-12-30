use crate::core::scanner::FileEntry;
use std::collections::HashMap;
use std::path::PathBuf;

pub struct Searcher;

impl Searcher {
    pub fn search_filenames(files: &HashMap<PathBuf, FileEntry>, query: &str) -> Vec<FileEntry> {
        let query_lower = query.to_lowercase();
        files
            .values()
            .filter(|entry| entry.name.to_lowercase().contains(&query_lower))
            .cloned()
            .collect()
    }

    // Content search will be implemented using grep-searcher or similar
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::scanner::{FileEntry, FileMetadata};

    #[test]
    fn test_search_filenames() {
        let mut files = HashMap::new();
        let entry1 = FileEntry {
            name: "test.txt".to_string(),
            path: PathBuf::from("test.txt"),
            metadata: FileMetadata {
                size: 0,
                mtime: None,
                is_dir: false,
            },
        };
        let entry2 = FileEntry {
            name: "hello.rs".to_string(),
            path: PathBuf::from("hello.rs"),
            metadata: FileMetadata {
                size: 0,
                mtime: None,
                is_dir: false,
            },
        };
        files.insert(entry1.path.clone(), entry1.clone());
        files.insert(entry2.path.clone(), entry2.clone());

        let results = Searcher::search_filenames(&files, "test");
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].name, "test.txt");

        let results = Searcher::search_filenames(&files, "HELL");
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].name, "hello.rs");
    }
}
