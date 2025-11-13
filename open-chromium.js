#!/usr/bin/env node

/**
 * Script to open Chromium browser only (no Chrome fallback)
 * Cross-platform support for Windows, macOS, and Linux
 */

import { exec } from 'child_process';
import { platform } from 'os';
import { existsSync } from 'fs';
import { join } from 'path';

const FRONTEND_URL = process.argv[2] || 'http://localhost:8080';
const osPlatform = platform();

function openChromium() {
  if (osPlatform === 'win32') {
    // Windows - check Chromium locations only
    const chromiumPaths = [
      join(process.env.ProgramFiles || '', 'Chromium', 'Application', 'chromium.exe'),
      join(process.env['ProgramFiles(x86)'] || '', 'Chromium', 'Application', 'chromium.exe'),
      join(process.env.LOCALAPPDATA || '', 'Chromium', 'Application', 'chromium.exe'),
    ];

    for (const path of chromiumPaths) {
      if (existsSync(path)) {
        console.log(`Found Chromium at: ${path}`);
        console.log('Opening Chromium browser...');
        exec(`"${path}" "${FRONTEND_URL}"`, (error) => {
          if (error) {
            console.error(`Failed to open Chromium: ${error.message}`);
          }
        });
        return;
      }
    }
    
    console.log('Chromium not found. Please install Chromium to auto-open the browser.');
    console.log(`Frontend URL: ${FRONTEND_URL}`);
    
  } else if (osPlatform === 'darwin') {
    // macOS - check for Chromium only
    exec('open -a "Chromium" "' + FRONTEND_URL + '"', (error) => {
      if (error) {
        console.log('Chromium not found. Please install Chromium to auto-open the browser.');
        console.log(`Frontend URL: ${FRONTEND_URL}`);
      } else {
        console.log('Opening Chromium browser...');
      }
    });
  } else {
    // Linux - check for Chromium only
    exec('which chromium', (error) => {
      if (!error) {
        console.log('Opening Chromium browser...');
        exec(`chromium "${FRONTEND_URL}"`, (execError) => {
          if (execError) {
            console.error(`Failed to open Chromium: ${execError.message}`);
          }
        });
      } else {
        exec('which chromium-browser', (error2) => {
          if (!error2) {
            console.log('Opening Chromium browser...');
            exec(`chromium-browser "${FRONTEND_URL}"`, (execError) => {
              if (execError) {
                console.error(`Failed to open Chromium: ${execError.message}`);
              }
            });
          } else {
            console.log('Chromium not found. Please install Chromium to auto-open the browser.');
            console.log(`Frontend URL: ${FRONTEND_URL}`);
          }
        });
      }
    });
  }
}

openChromium();

