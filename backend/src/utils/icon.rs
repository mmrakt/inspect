use anyhow::{anyhow, Result};
use base64::{engine::general_purpose, Engine as _};
use plist::Value;
use std::fs;
use std::path::Path;
use std::process::Command;

pub fn extract_app_icon(app_path: &Path) -> Result<String> {
    // 1. Find the icon name from Info.plist
    let plist_path = app_path.join("Contents/Info.plist");
    if !plist_path.exists() {
        return Err(anyhow!("Info.plist not found"));
    }

    let val = Value::from_file(plist_path)?;
    let icon_file = val
        .as_dictionary()
        .and_then(|dict| {
            dict.get("CFBundleIconFile")
                .or_else(|| dict.get("CFBundleIconName"))
        })
        .and_then(|v| v.as_string())
        .map(|s| s.to_string());

    let icon_name = match icon_file {
        Some(name) => {
            if name.ends_with(".icns") {
                name
            } else {
                format!("{}.icns", name)
            }
        }
        None => "AppIcon.icns".to_string(),
    };

    let mut icns_path = app_path.join("Contents/Resources").join(&icon_name);
    if !icns_path.exists() {
        icns_path = app_path.join("Contents/Resources/AppIcon.icns");
        if !icns_path.exists() {
            return Err(anyhow!(
                "Icon file not found (tried {} and AppIcon.icns)",
                icon_name
            ));
        }
    }

    // 2. Convert to PNG using sips
    let temp_dir = std::env::temp_dir();
    let png_path = temp_dir.join(format!(
        "inspect_icon_{}.png",
        app_path.file_name().unwrap_or_default().to_string_lossy()
    ));

    let output = Command::new("sips")
        .args(["-s", "format", "png", "-z", "32", "32"])
        .arg(&icns_path)
        .arg("--out")
        .arg(&png_path)
        .output()?;

    if !output.status.success() {
        return Err(anyhow!(
            "sips failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    // 3. Read and encode to Base64
    let png_data = fs::read(&png_path)?;
    let b64 = general_purpose::STANDARD.encode(png_data);

    // Clean up
    let _ = fs::remove_file(png_path);

    Ok(format!("data:image/png;base64,{}", b64))
}
