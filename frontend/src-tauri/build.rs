fn main() {
    // The native CI currently validates compilation before packaging. Tauri's
    // default Windows build attributes assume `icons/icon.ico` exists even
    // when bundling is disabled. Keep the application manifest, but leave the
    // optional Windows executable icon to the packaging stage where the full
    // generated icon set is supplied.
    let windows = tauri_build::WindowsAttributes::new();
    let attrs = tauri_build::Attributes::new().windows_attributes(windows);
    tauri_build::try_build(attrs).expect("failed to run Tauri build script");
}
