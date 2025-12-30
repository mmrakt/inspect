use anyhow::Result;
use grep_regex::RegexMatcher;
use grep_searcher::sinks::UTF8;
use grep_searcher::Searcher;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContentMatch {
    pub line_number: u64,
    pub line_content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult {
    pub path: String,
    pub matches: Vec<ContentMatch>,
}

pub struct ContentSearcher;

impl ContentSearcher {
    pub fn search_file(path: &Path, query: &str) -> Result<Option<SearchResult>> {
        let matcher = RegexMatcher::new(query)?;
        let mut matches = Vec::new();

        Searcher::new().search_path(
            &matcher,
            path,
            UTF8(|line_number, line| {
                matches.push(ContentMatch {
                    line_number,
                    line_content: line.trim().to_string(),
                });
                Ok(true)
            }),
        )?;

        if matches.is_empty() {
            Ok(None)
        } else {
            Ok(Some(SearchResult {
                path: path.to_string_lossy().to_string(),
                matches,
            }))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_search_file() -> Result<()> {
        let dir = tempdir()?;
        let file_path = dir.path().join("test.txt");
        fs::write(&file_path, "line 1\nsearch term\nline 3")?;

        let result = ContentSearcher::search_file(&file_path, "search term")?;
        assert!(result.is_some());
        let search_result = result.unwrap();
        assert_eq!(search_result.matches.len(), 1);
        assert_eq!(search_result.matches[0].line_number, 2);
        assert_eq!(search_result.matches[0].line_content, "search term");

        let no_result = ContentSearcher::search_file(&file_path, "not found")?;
        assert!(no_result.is_none());
        Ok(())
    }
}
