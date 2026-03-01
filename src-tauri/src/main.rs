#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    intelliwork_lib::run()
}
