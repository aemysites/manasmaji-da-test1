/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import core from '@actions/core';
import { getAccessTokenWithFallback } from './ims-token-helper.js';

const DA_ADMIN_API = 'https://admin.da.live';

/**
 * Makes a request to the DA Admin API.
 * @param {string} token - The DA access token for authentication.
 * @param {string} endpoint - The API endpoint (relative to base).
 * @param {object} [options={}] - Additional fetch options (method, body, etc).
 * @returns {Promise<object>} The parsed JSON response from the API.
 * @throws Will throw an error if the response is not ok.
 */
async function daFetch(token, endpoint, options = {}) {
  // Only set Content-Type if not using FormData (FormData sets its own boundary)
  const defaultHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
  const res = await fetch(`${DA_ADMIN_API}${endpoint}`, {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    core.warning(`DA Admin API error ${res.status}: ${errorText}`);
    throw new Error(`DA Admin API error ${res.status}: ${errorText}`);
  }
  
  // Handle different content types
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

/**
 * Lists the sources in a specified path in DA.
 * @param {string} token - The DA access token.
 * @param {string} org - The organization.
 * @param {string} repo - The repository.
 * @param {string} path - The path to list sources from.
 * @returns {Promise<Array<object>>} An array of source objects in the path.
 */
async function listSources(token, org, repo, path = '') {
  const endpoint = `/list/${org}/${repo}/${path}`;
  const data = await daFetch(token, endpoint);
  return data.sources || [];
}

/**
 * Creates a backup folder in DA with a timestamped name.
 * @param {string} token - The DA access token.
 * @param {string} org - The organization.
 * @param {string} repo - The repository.
 * @param {string} parentPath - The parent path where the backup folder will be created.
 * @returns {Promise<{name: string, path: string}>} The name and path of the created backup folder.
 */
async function createBackupFolder(token, org, repo, parentPath = '') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupName = `backup-${timestamp}`;
  
  // Create the backup folder path
  const backupPath = parentPath ? `${parentPath}/${backupName}` : backupName;
  
  // Create a placeholder document in the backup folder to establish the folder structure
  const placeholderContent = `# Backup Folder\n\nCreated: ${new Date().toISOString()}\n\nThis folder contains backed up content.`;
  const formData = new FormData();
  formData.append('data', new Blob([placeholderContent], { type: 'text/plain' }));
  
  const endpoint = `/source/${org}/${repo}/${backupPath}/readme.md`;
  await daFetch(token, endpoint, {
    method: 'POST',
    body: formData,
  });
  
  core.info(`Created backup folder: ${backupName}`);
  return { name: backupName, path: backupPath };
}

/**
 * Moves a source to a destination path within DA.
 * @param {string} token - The DA access token.
 * @param {string} org - The organization.
 * @param {string} repo - The repository.
 * @param {string} sourcePath - The path of the source to move.
 * @param {string} destPath - The destination path.
 * @returns {Promise<void>} Resolves when the move is complete.
 */
async function moveSource(token, org, repo, sourcePath, destPath) {
  // URL encode the path components to handle special characters
  const encodedSourcePath = encodeURIComponent(sourcePath).replace(/%2F/g, '/');
  const endpoint = `/move/${org}/${repo}/${encodedSourcePath}`;
  const formData = new FormData();
  formData.append('destination', `/${org}/${repo}/${destPath}`);
  
  await daFetch(token, endpoint, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Extracts the source name and path from a DA source object.
 * @param {object} source - The source object from DA.
 * @param {string} org - The organization name.
 * @param {string} repo - The repository name.
 * @returns {{name: string, path: string}} The extracted name and path.
 */
function getSourceInfo(source, org, repo) {
  // Compile regex once for better performance
  const pathRegex = new RegExp(`/${org}/${repo}/(.+)$`);
  
  // Try to extract from editUrl first (more reliable)
  if (source.editUrl) {
    const pathMatch = source.editUrl.match(pathRegex);
    if (pathMatch) {
      const fullPath = pathMatch[1];
      const nameMatch = fullPath.match(/([^\/]+)$/);
      return {
        name: nameMatch ? nameMatch[1] : `source-${Date.now()}`,
        path: fullPath
      };
    }
  }
  
  // Fallback to contentUrl
  if (source.contentUrl) {
    const pathMatch = source.contentUrl.match(pathRegex);
    if (pathMatch) {
      const fullPath = pathMatch[1];
      const nameMatch = fullPath.match(/([^\/]+)$/);
      return {
        name: nameMatch ? nameMatch[1] : `source-${Date.now()}`,
        path: fullPath
      };
    }
  }
  
  // Final fallback
  const fallbackName = `source-${Date.now()}`;
  return {
    name: fallbackName,
    path: fallbackName
  };
}

/**
 * Main function to run the backup and move operation for DA content.
 * Gets DA sources, creates a backup folder, and moves items except certain reserved items.
 * Sets the backup folder name as an output.
 * @returns {Promise<void>}
 */
export async function run() {
  try {
    // Input validation
    const org = core.getInput('org')?.trim();
    const repo = core.getInput('repo')?.trim();
    const path = core.getInput('path')?.trim() || '';
    
    if (!org || !repo) {
      throw new Error('Both org and repo inputs are required');
    }
    
    core.info(`Starting DA backup for org: ${org}, repo: ${repo}${path ? `, path: ${path}` : ' (root)'}`);
    
    // Get access token with fallback logic
    const token = await getAccessTokenWithFallback();
    if (!token) {
      throw new Error('No access token available. Please configure DA_CLIENT_ID, DA_CLIENT_SECRET, DA_SERVICE_TOKEN or IMS_TOKEN secrets.');
    }
    
    // 1. List sources in the specified path
    const sources = await listSources(token, org, repo, path);
    core.info(`Found ${sources.length} sources to process`);
    
    if (sources.length === 0) {
      core.info('No sources found to backup');
      core.setOutput('backup_folder_name', 'no-backup-needed');
      return;
    }
    
    // 2. Create backup folder
    const backup = await createBackupFolder(token, org, repo, path);
    
    // 3. Move sources except reserved items (similar to SharePoint logic)
    const reservedItems = ['tools', 'block-collection'];
    let movedCount = 0;
    
    for (const source of sources) {
      const sourceInfo = getSourceInfo(source, org, repo);
      
      // Skip reserved items
      if (reservedItems.some(reserved => sourceInfo.name.toLowerCase().includes(reserved.toLowerCase()))) {
        core.info(`Skipping reserved item: ${sourceInfo.name}`);
        continue;
      }
      
      if (!sourceInfo.path) {
        core.warning(`Could not determine source path for: ${sourceInfo.name}`);
        continue;
      }
      
      try {
        // Determine destination path within backup folder
        const destPath = `${backup.path}/${sourceInfo.name}`;
        
        await moveSource(token, org, repo, sourceInfo.path, destPath);
        core.info(`Moved ${sourceInfo.name} to ${backup.name}`);
        movedCount++;
        
      } catch (err) {
        core.warning(`Failed to move ${sourceInfo.name} to ${backup.name}: ${err.message}`);
      }
    }
    
    core.info(`Backup completed. Moved ${movedCount} items to ${backup.name}`);
    core.setOutput('backup_folder_name', backup.name);
    
  } catch (error) {
    core.error(`DA backup failed: ${error.message}`);
    core.setOutput('error_message', `❌ DA backup failed: ${error.message}`);
    core.setFailed(error.message);
  }
}

await run();
