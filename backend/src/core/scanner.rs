use anyhow::Result;
use ignore::WalkBuilder;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileMetadata {
    pub size: u64,
    pub mtime: Option<u64>,
    pub is_dir: bool,
    pub is_app: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub path: PathBuf,
    pub name: String,
    pub metadata: FileMetadata,
}

pub struct Scanner {
    base_path: PathBuf,
    max_depth: Option<usize>,
    show_hidden: bool,
}

impl Scanner {
    pub fn new<P: AsRef<Path>>(path: P) -> Self {
        Self {
            base_path: path.as_ref().to_path_buf(),
            max_depth: None,
            show_hidden: false,
        }
    }

    pub fn with_max_depth(mut self, depth: usize) -> Self {
        self.max_depth = Some(depth);
        self
    }

    pub fn with_show_hidden(mut self, show: bool) -> Self {
        self.show_hidden = show;
        self
    }

    pub fn scan(&self) -> Result<Vec<FileEntry>> {
        let mut entries = Vec::new();
        let mut builder = WalkBuilder::new(&self.base_path);
        builder
            .hidden(!self.show_hidden)
            .git_ignore(true)
            .max_depth(self.max_depth)
            .follow_links(true);

        let walker = builder.build();

        for result in walker {
            match result {
                Ok(entry) => {
                    if entry.path() == self.base_path {
                        continue;
                    }

                    let metadata = entry.metadata()?;
                    let mtime = metadata
                        .modified()
                        .ok()
                        .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs());

                    let is_dir = metadata.is_dir();
                    let is_app = is_dir && entry.file_name().to_string_lossy().ends_with(".app");

                    let file_entry = FileEntry {
                        path: entry.path().to_path_buf(),
                        name: entry.file_name().to_string_lossy().to_string(),
                        metadata: FileMetadata {
                            size: metadata.len(),
                            mtime,
                            is_dir: is_dir && !is_app,
                            is_app,
                        },
                    };
                    entries.push(file_entry);
                }
                Err(err) => println!("Error scanning: {}", err),
            }
        }
        Ok(entries)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_scanner_basic() -> Result<()> {
        let dir = tempdir()?;
        let file_path = dir.path().join("test.txt");
        fs::write(&file_path, "hello")?;

        let scanner = Scanner::new(dir.path());
        let results = scanner.scan()?;

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].name, "test.txt");
        assert_eq!(results[0].metadata.size, 5);
        assert_eq!(results[0].metadata.is_app, false);
        Ok(())
    }

    #[test]
    fn test_scanner_with_depth() -> Result<()> {
        let dir = tempdir()?;
        let sub_dir = dir.path().join("sub");
        fs::create_dir(&sub_dir)?;
        let file_path = sub_dir.join("inner.txt");
        fs::write(&file_path, "hello")?;

        // Shallow scan (depth 1) should only see "sub"
        let scanner = Scanner::new(dir.path()).with_max_depth(1);
        let results = scanner.scan()?;
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].name, "sub");

        // Recursive scan (None) should see "sub" and "inner.txt"
        let scanner_recursive = Scanner::new(dir.path());
        let results_recursive = scanner_recursive.scan()?;
        assert_eq!(results_recursive.len(), 2);

        Ok(())
    }
}
