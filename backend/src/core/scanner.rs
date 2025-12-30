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
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub path: PathBuf,
    pub name: String,
    pub metadata: FileMetadata,
}

pub struct Scanner {
    base_path: PathBuf,
}

impl Scanner {
    pub fn new<P: AsRef<Path>>(path: P) -> Self {
        Self {
            base_path: path.as_ref().to_path_buf(),
        }
    }

    pub fn scan(&self) -> Result<Vec<FileEntry>> {
        let mut entries = Vec::new();
        let walker = WalkBuilder::new(&self.base_path)
            .hidden(false) // Show hidden files by default, let ignore handle it if needed
            .git_ignore(true)
            .build();

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

                    let file_entry = FileEntry {
                        path: entry.path().to_path_buf(),
                        name: entry.file_name().to_string_lossy().to_string(),
                        metadata: FileMetadata {
                            size: metadata.len(),
                            mtime,
                            is_dir: metadata.is_dir(),
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
        Ok(())
    }
}
