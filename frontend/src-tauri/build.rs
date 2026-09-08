fn main() {
    // Native compilation must not depend on installer-only icon assets. The
    // packaging pipeline supplies the platform icon set separately.
    let windows = tauri_build::WindowsAttributes::new_without_app_manifest();
    let attrs = tauri_build::Attributes::new().windows_attributes(windows);
    tauri_build::try_build(attrs).expect("failed to run Tauri build script");
}
