fn main() {
    if cfg!(target_os = "linux") {
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "0");
        std::env::set_var("WEBKIT_FORCE_HARDWARE_ACCELERATION", "1");
    }
    tauri_build::build();
}
