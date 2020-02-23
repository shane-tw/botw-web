use std::io::{Write, Cursor};
use std::path::PathBuf;
use std::ffi::OsStr;
use serde::{Deserialize};
use serde_wasm_bindgen;
use wasm_bindgen::prelude::*;

#[derive(Deserialize)]
pub struct FileMeta{
    path: PathBuf,

    #[serde(with = "serde_bytes")]
    contents: Vec<u8>,
}

#[wasm_bindgen]
pub fn get_save_version(game_data_file: JsValue, option_file: JsValue) -> Result<String, JsValue> {
    let game_data_sav: FileMeta = serde_wasm_bindgen::from_value(game_data_file)?;
    let option_sav: FileMeta = serde_wasm_bindgen::from_value(option_file)?;

    let platform = match botw_conv::get_save_platform(&mut Cursor::new(&option_sav.contents)) {
        Ok(p) => p,
        Err(e) => {
            return Err(JsValue::from(format!("Failed to get save platform, reason: {}", e)));
        }
    };

    let version = match botw_conv::get_save_version(&mut Cursor::new(&game_data_sav.contents), &platform) {
        Ok(v) => v,
        Err(e) => {
            return Err(JsValue::from(format!("Failed to get save version, reason: {}", e)));
        }
    };

    Ok(version)
}

#[wasm_bindgen]
pub fn get_save_target_platform(option_sav: JsValue) -> Result<String, JsValue> {
    let option_sav: FileMeta = serde_wasm_bindgen::from_value(option_sav)?;
    let platform = match botw_conv::get_save_platform(&mut Cursor::new(&option_sav.contents)) {
        Ok(p) => p,
        Err(e) => {
            return Err(JsValue::from(format!("Failed to get save platform, reason: {}", e)));
        }
    };
    let target_platform = match platform {
        botw_conv::SavePlatform::WiiU => botw_conv::SavePlatform::Switch,
        _ => botw_conv::SavePlatform::WiiU,
    };
    Ok(target_platform.to_string().to_lowercase())
}

#[wasm_bindgen]
pub fn convert_saves(files: JsValue) -> Result<Vec<u8>, JsValue> {
    let files: Vec<FileMeta> = serde_wasm_bindgen::from_value(files)?;

    let w = Cursor::new(Vec::new());
    let mut zip = zip::ZipWriter::new(w);

    let options = zip::write::FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    for file in files {
        let mut bytes = file.contents.clone();

        let file_path = match file.path.to_str() {
            Some(s) => s,
            _ => {
                return Err(JsValue::from("Failed to determine file path"));
            },
        };

        if file.path.extension() == Some(OsStr::new("sav")) {
            if let Err(e) = botw_conv::convert_save(&mut Cursor::new(&mut bytes), &file.path) {
                return Err(JsValue::from(format!("Failed to convert file {}, reason: {}", file_path, e)));
            }
        }

        if let Err(e) = zip.start_file(file_path, options) {
            return Err(JsValue::from(format!("Failed to start file {}, reason: {}", file_path, e)));
        };

        if let Err(e) = zip.write_all(&bytes) {
            return Err(JsValue::from(format!("Failed to write file {}, reason: {}", file_path, e)));
        };
    }

    let zip_result = match zip.finish() {
        Ok(r) => r,
        _ => {
            return Err(JsValue::from("Failed to finish zip"));
        }
    };

    Ok(zip_result.get_ref().to_vec())
}