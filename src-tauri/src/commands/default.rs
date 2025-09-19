use super::errors::Error;
use std::fs;

#[tauri::command]
pub fn read(path: String) -> Result<String, Error> {
    let data = fs::read(path)?;
    let string = String::from_utf8(data)?;
    Ok(string)
}

#[tauri::command]
pub fn write(path: String, contents: String) -> Result<(), Error> {
    fs::write(path, contents)?;
    Ok(())
}

#[tauri::command]
pub fn get_os() -> Result<String, Error> {
    let os: String = std::env::consts::OS.to_string();
    if os == "linux" || os == "windows" || os == "macos" {
        return Ok(os);
    } else {
        return Err(std::io::Error::new(std::io::ErrorKind::Other, "unsupported os").into());
    }
}
