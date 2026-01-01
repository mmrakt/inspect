use std::fs;
use std::path::{Path, PathBuf};

/// Opens a file or application using the default system handler.
#[tauri::command]
#[specta::specta]
pub async fn open_app(path: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app_handle
        .opener()
        .open_path(path, None::<String>)
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Internal implementation for moving multiple file system entries.
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

/// Moves multiple files or directories to a target directory.
#[tauri::command]
#[specta::specta]
pub async fn move_entries(paths: Vec<String>, target_dir: String) -> Result<Vec<String>, String> {
    let sources: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
    let target = PathBuf::from(target_dir);
    let moved = move_entries_impl(&sources, &target)?;
    Ok(moved
        .into_iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect())
}

/// Renames a file or directory.
#[tauri::command]
#[specta::specta]
pub async fn rename_entry(path: String, new_name: String) -> Result<(), String> {
    let source = PathBuf::from(&path);
    let parent = source.parent().ok_or("Invalid path")?;
    let destination = parent.join(new_name);

    if destination.exists() {
        return Err("Target already exists".to_string());
    }

    fs::rename(source, destination).map_err(|e| e.to_string())?;
    Ok(())
}

/// Creates a duplicate of a file or directory with a "copy" suffix.
#[tauri::command]
#[specta::specta]
pub async fn duplicate_entry(path: String) -> Result<String, String> {
    let source = PathBuf::from(&path);
    let parent = source.parent().ok_or("Invalid path")?;
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

    loop {
        if counter == 0 {
            new_name = format!("{} copy", base_stem);
            counter = 1;
        } else {
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

/// Recursively copies a directory and its contents.
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

/// Moves a file or directory to the system trash.
#[tauri::command]
#[specta::specta]
pub async fn move_to_trash(path: String) -> Result<(), String> {
    trash::delete(path).map_err(|e| e.to_string())?;
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

    #[tokio::test]
    async fn rename_entry_renames_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("old.txt");
        fs::write(&file_path, "test").unwrap();

        super::rename_entry(
            file_path.to_string_lossy().to_string(),
            "new.txt".to_string(),
        )
        .await
        .unwrap();

        assert!(!file_path.exists());
        assert!(dir.path().join("new.txt").exists());
        assert_eq!(
            fs::read_to_string(dir.path().join("new.txt")).unwrap(),
            "test"
        );
    }

    #[test]
    fn copy_recursively_works() {
        let source_dir = tempdir().unwrap();
        let dest_dir = tempdir().unwrap();

        let sub_dir = source_dir.path().join("sub");
        fs::create_dir(&sub_dir).unwrap();
        fs::write(sub_dir.join("a.txt"), "a").unwrap();
        fs::write(source_dir.path().join("b.txt"), "b").unwrap();

        let dest_path = dest_dir.path().join("copied");
        super::copy_recursively(source_dir.path(), &dest_path).unwrap();

        assert!(dest_path.join("sub/a.txt").exists());
        assert!(dest_path.join("b.txt").exists());
        assert_eq!(
            fs::read_to_string(dest_path.join("sub/a.txt")).unwrap(),
            "a"
        );
    }
}
