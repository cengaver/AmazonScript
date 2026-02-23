// ==UserScript==
// @name         Amazon Favorite
// @namespace    https://github.com/cengaver
// @version      1.38
// @description  Fvorite list a product on Amazon.
// @author       Cengaver
// @match        https://www.amazon.com/dp/*
// @match        https://www.amazon.com/*/dp/*
// @match        https://sellercentral.amazon.com/opportunity-explorer/niche/*
// @match        *://app.podly.co/*
// @include      *://app.podly.co/#/search/product-details/*
// @connect      sheets.googleapis.com
// @grant        GM.addStyle
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-idle
// @icon         https://www.google.com/s2/favicons?domain=amazon.com
// @downloadURL  https://github.com/cengaver/AmazonScript/raw/refs/heads/main/AmazonFavorite.user.js
// @updateURL    https://github.com/cengaver/AmazonScript/raw/refs/heads/main/AmazonFavorite.user.js
// ==/UserScript==

(async function() {
    'use strict';

    // Modern UI Styles
    GM.addStyle(`
        :root {
            --primary-color: #4285f4;
            --primary-dark: #3367d6;
            --secondary-color: #34a853;
            --secondary-dark: #2e7d32;
            --danger-color: #ea4335;
            --danger-dark: #c62828;
            --warning-color: #fbbc05;
            --warning-dark: #f57f17;
            --light-color: #f8f9fa;
            --dark-color: #202124;
            --gray-color: #5f6368;
            --border-radius: 4px;
            --box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            --transition: all 0.3s ease;
            --font-family: 'Segoe UI', Roboto, Arial, sans-serif;
        }

        /* Toast Notifications */
        .toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .toast {
            min-width: 280px;
            padding: 12px 16px;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            font-family: var(--font-family);
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            opacity: 0;
            transform: translateY(20px);
            transition: var(--transition);
        }

        .toast.show {
            opacity: 1;
            transform: translateY(0);
        }

        .toast-success {
            background-color: var(--secondary-color);
            color: white;
        }

        .toast-error {
            background-color: var(--danger-color);
            color: white;
        }

        .toast-warning {
            background-color: var(--warning-color);
            color: var(--dark-color);
        }

        .toast-info {
            background-color: var(--primary-color);
            color: white;
        }

        .toast-close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 16px;
            margin-left: 10px;
            opacity: 0.7;
        }

        .toast-close:hover {
            opacity: 1;
        }

        /* Buttons */
        .etsy-tool-btn {
            padding: 8px 12px;
            border: none;
            border-radius: var(--border-radius);
            font-family: var(--font-family);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .etsy-tool-btn:focus {
            outline: none;
        }

        .etsy-tool-btn-primary {
            background-color: var(--primary-color);
            color: white;
        }

        .etsy-tool-btn-primary:hover {
            background-color: var(--primary-dark);
        }

        .etsy-tool-btn-secondary {
            background-color: var(--secondary-color);
            color: white;
        }

        .etsy-tool-btn-secondary:hover {
            background-color: var(--secondary-dark);
        }

        .etsy-tool-btn-danger {
            background-color: var(--danger-color);
            color: white;
        }

        .etsy-tool-btn-danger:hover {
            background-color: var(--danger-dark);
        }

        .etsy-tool-btn-warning {
            background-color: var(--warning-color);
            color: var(--dark-color);
        }

        .etsy-tool-btn-warning:hover {
            background-color: var(--warning-dark);
        }

        .etsy-tool-btn-light {
            background-color: var(--light-color);
            color: var(--dark-color);
            border: 1px solid #ddd;
        }

        .etsy-tool-btn-light:hover {
            background-color: #e9ecef;
        }

        .etsy-tool-btn-sm {
            padding: 4px 8px;
            font-size: 12px;
        }

        .etsy-tool-btn-lg {
            padding: 10px 16px;
            font-size: 16px;
        }

        .etsy-tool-btn-icon {
            width: 32px;
            height: 32px;
            padding: 0;
            border-radius: 50%;
        }

        /* Inputs */
        .etsy-tool-input {
            padding: 2px 4px;
            border: 1px solid #ddd;
            border-radius: var(--border-radius);
            font-family: var(--font-family);
            font-size: 16px;
            transition: var(--transition);
        }

        .etsy-tool-input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }

        .etsy-tool-select {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: var(--border-radius);
            font-family: var(--font-family);
            font-size: 14px;
            background-color: white;
            cursor: pointer;
            transition: var(--transition);
        }

        .etsy-tool-select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }

        /* Panels */
        .etsy-tool-panel {
            background-color: white;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            overflow: hidden;
        }

        .etsy-tool-panel-header {
            padding: 12px 16px;
            background-color: var(--primary-color);
            color: white;
            font-family: var(--font-family);
            font-size: 16px;
            font-weight: 500;
            display: flex;
            cursor: move;
            align-items: center;
            justify-content: space-between;
        }

        .etsy-tool-panel-body {
            padding: 16px;
        }

        /* Main Toolbar */
        .etsy-tool-toolbar {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            display: flex;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            flex-direction: column;
            gap: 10px;
            width: 300px;
        }

        /* Image Thumbnails */
        .etsy-tool-thumbnails {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
        }

        .etsy-tool-thumbnail {
            position: relative;
            width: 100%;
            padding-top: 100%; /* 1:1 Aspect Ratio */
            border-radius: var(--border-radius);
            overflow: hidden;
            cursor: pointer;
            box-shadow: var(--box-shadow);
            transition: var(--transition);
        }

        .etsy-tool-thumbnail:hover {
            transform: scale(1.05);
        }

        .etsy-tool-thumbnail img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .etsy-tool-thumbnail-actions {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: space-around;
            padding: 5px;
            opacity: 0;
            transition: var(--transition);
        }

        .etsy-tool-thumbnail:hover .etsy-tool-thumbnail-actions {
            opacity: 1;
        }

        /* Modal */
        .etsy-tool-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            visibility: hidden;
            transition: var(--transition);
        }

        .etsy-tool-modal-overlay.show {
            opacity: 1;
            visibility: visible;
        }

        .etsy-tool-modal {
            background-color: white;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow: auto;
            transform: translateY(-20px);
            transition: var(--transition);
        }

        .etsy-tool-modal-overlay.show .etsy-tool-modal {
            transform: translateY(0);
        }

        .etsy-tool-modal-header {
            padding: 16px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .etsy-tool-modal-title {
            font-family: var(--font-family);
            font-size: 18px;
            font-weight: 500;
            margin: 0;
        }

        .etsy-tool-modal-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: var(--gray-color);
        }

        .etsy-tool-modal-body {
            padding: 16px;
        }

        .etsy-tool-modal-footer {
            padding: 16px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        /* Image Viewer */
        .etsy-tool-image-viewer {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        .etsy-tool-image-viewer img {
            max-width: 100%;
            max-height: 70vh;
            object-fit: contain;
        }

        /* PNG Filter Panel */
        .etsy-tool-png-filter {
            margin-top: 10px;
        }

        .etsy-tool-png-list {
            margin-top: 10px;
            max-height: 300px;
            overflow-y: auto;
        }

        .etsy-tool-png-item {
            display: flex;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: var(--transition);
        }

        .etsy-tool-png-item:hover {
            background-color: #f5f5f5;
        }

        .etsy-tool-png-item.selected {
            background-color: rgba(66, 133, 244, 0.1);
        }

        .etsy-tool-png-item-checkbox {
            margin-right: 10px;
        }

        .etsy-tool-png-item-thumbnail {
            width: 40px;
            height: 40px;
            border-radius: var(--border-radius);
            overflow: hidden;
            margin-right: 10px;
        }

        .etsy-tool-png-item-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .etsy-tool-png-item-info {
            flex: 1;
        }

        .etsy-tool-png-item-title {
            font-weight: 500;
            margin-bottom: 2px;
        }

        .etsy-tool-png-item-sku {
            font-size: 12px;
            color: var(--gray-color);
        }

        /* Loading Spinner */
        .etsy-tool-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .etsy-tool-toolbar {
                width: 250px;
            }

            .etsy-tool-thumbnails {
                grid-template-columns: repeat(2, 1fr);
            }
        }
     #InfoBalloon {
      position: fixed;
      top: 60px; left: 90%;
      transform: translateX(-50%);
      background-color: #d6ff00;
      color: black;
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      z-index: 9999;
     }
     .heart-icon {
       /*cursor: pointer;*/
       color: red;
       margin-left: 5px;
       font-size: x-large;
     }
     .heart-icon:hover {
       transform: scale(1.2);
     }
    `);

    // Config yapısı
    const DEFAULT_CONFIG = {
        sheetId: await GM.getValue('sheetId', ''),
        sheetId2: await GM.getValue('sheetId2', ''),
        range: await GM.getValue('range', 'Liste!E:AD'),
        rangeLink: await GM.getValue('rangeLink', 'Liste!F:F'),
        privateKey: await GM.getValue('privateKey', ''),
        clientEmail: await GM.getValue('clientEmail', ''),
        team: await GM.getValue('team', 'Amazon'),
    };

    // Global değişkenler
    let config = {...DEFAULT_CONFIG};
    let configLoaded = false; // Add a flag to track if config is loaded
    let toastContainer = null;

    // Config yönetimi
    async function loadConfig() {
        try {
            const savedConfig = await GM.getValue('Config');
            if (savedConfig) {
                config = {...DEFAULT_CONFIG, ...savedConfig};
                configLoaded = true;
                return true;
            }else if(DEFAULT_CONFIG.privateKey){
                await migrateConfig()
                return true;
            }
            return false;
        } catch (error) {
            console.error('Config yükleme hatası:', error);
            return false;
        }
    }

    async function migrateConfig() {
        await saveConfig();
        for (const key of Object.keys(DEFAULT_CONFIG)) await GM.deleteValue(key);
    }

    async function saveConfig() {
        await GM.setValue('Config', config);
    }

    // Config kontrol fonksiyonu
    async function checkConfig() {
        return await loadConfig();
    }

    // Config doğrulama
    async function validateConfig() {
        if (!await checkConfig()) {
            showToast('Config yüklenemedi', 'error');
            return false;
        }

        if (!config.clientEmail || !config.privateKey) {
            showToast('Google Service Account credentials missing', 'error');
            return false;
        }
        return true;
    }

    // Modern Toast Notification System
    function createToastContainer() {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }

    function showToast(message, type = 'success', duration = 3000) {
        const container = createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        });

        toast.appendChild(messageSpan);
        toast.appendChild(closeBtn);
        container.appendChild(toast);

        // Show animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    // Modern Config Dialog
    async function showConfigMenu() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'etsy-tool-modal-overlay';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'etsy-tool-modal';

        // Modal header
        const header = document.createElement('div');
        header.className = 'etsy-tool-modal-header';

        const title = document.createElement('h3');
        title.className = 'etsy-tool-modal-title';
        title.textContent = 'Etsy Tool Ayarları';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'etsy-tool-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Modal body
        const body = document.createElement('div');
        body.className = 'etsy-tool-modal-body';

        // Form fields
        const fields = [
            { id: 'clientEmail', label: 'Client Email', type: 'text', value: config.clientEmail },
            { id: 'privateKey', label: 'Private Key', type: 'textarea', value: config.privateKey },
            { id: 'rangeLink', label: 'Range Link', type: 'text', value: config.rangeLink },
            { id: 'sheetId', label: 'Sheet ID', type: 'text', value: config.sheetId },
            { id: 'range', label: 'Range ', type: 'text', value: config.range },
            { id: 'sheetId2', label: 'SheetId2', type: 'text', value: config.sheetId2 },
            { id: 'team', label: 'Team', type: 'text', value: config.team }
        ];

        fields.forEach(field => {
            const fieldContainer = document.createElement('div');
            fieldContainer.style.marginBottom = '15px';

            const label = document.createElement('label');
            label.textContent = field.label;
            label.style.display = 'block';
            label.style.marginBottom = '5px';
            label.style.fontWeight = 'bold';

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.style.height = '100px';
            } else {
                input = document.createElement('input');
                input.type = field.type;
            }

            input.id = field.id;
            input.className = 'etsy-tool-input';
            input.value = field.value;
            input.style.width = '100%';

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);
            body.appendChild(fieldContainer);
        });

        // Modal footer
        const footer = document.createElement('div');
        footer.className = 'etsy-tool-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'etsy-tool-btn etsy-tool-btn-light';
        cancelBtn.textContent = 'İptal';
        cancelBtn.addEventListener('click', () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        });

        const saveBtn = document.createElement('button');
        saveBtn.className = 'etsy-tool-btn etsy-tool-btn-primary';
        saveBtn.textContent = 'Kaydet';
        saveBtn.addEventListener('click', async () => {
            // Save config
            fields.forEach(field => {
                config[field.id] = field.type=='number' ? parseFloat(document.getElementById(field.id).value) : document.getElementById(field.id).value;
            });

            await saveConfig();
            showToast('Ayarlar başarıyla kaydedildi', 'success');

            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        });

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);

        // Add to document
        document.body.appendChild(overlay);

        // Show with animation
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    // Elementi sürüklenebilir yap
    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // Fare pozisyonunu al
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // Fare hareket ettiğinde çağrılacak fonksiyon
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // Yeni pozisyonu hesapla
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // Elementin pozisyonunu ayarla
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            // Sabit konumdan çıkar
            element.style.bottom = "auto";
            element.style.right = "auto";
        }

        function closeDragElement() {
            // Sürükleme işlemini durdur
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // JWT Token Creation
    const tokenUri = "https://oauth2.googleapis.com/token";

    async function createJwtToken() {
        try {
            const header = {
                alg: "RS256",
                typ: "JWT",
            };

            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iss: config.clientEmail,
                scope: "https://www.googleapis.com/auth/spreadsheets",
                aud: tokenUri,
                exp: now + 3600, // 1 hour expiration
                iat: now,
            };

            // Function to base64 encode JSON strings
            function base64Encode(obj) {
                return btoa(JSON.stringify(obj))
                    .replace(/=/g, "")
                    .replace(/\+/g, "-")
                    .replace(/\//g, "_");
            }

            const encodedHeader = base64Encode(header);
            const encodedPayload = base64Encode(payload);

            // Sign the token using the private key
            const toSign = `${encodedHeader}.${encodedPayload}`;
            const signature = await signWithPrivateKey(toSign);
            return `${toSign}.${signature}`;
        } catch (error) {
            console.error('JWT creation failed:', error);
            return null;
        }
    }

    async function signWithPrivateKey(data) {
        try {
            const crypto = window.crypto.subtle || window.crypto.webkitSubtle;

            // Clean and prepare the private key
            const pemContents = config.privateKey
            .replace(/-----BEGIN PRIVATE KEY-----/, '')
            .replace(/-----END PRIVATE KEY-----/, '')
            .replace(/\s+/g, '');

            // Convert from Base64 to ArrayBuffer
            const binaryString = atob(pemContents);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Import the key
            const key = await crypto.importKey(
                'pkcs8',
                bytes.buffer,
                { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
                false,
                ['sign']
            );

            // Sign the data
            const signature = await crypto.sign(
                'RSASSA-PKCS1-v1_5',
                key,
                new TextEncoder().encode(data)
            );

            // Convert signature to Base64URL
            return btoa(String.fromCharCode(...new Uint8Array(signature)))
                .replace(/=/g, '')
                .replace(/\+/g, '-')
                .replace(/\//g, '_');
        } catch (error) {
            console.error('Error in signWithPrivateKey:', error);
            showToast('JWT signing failed. Check private key format.', 'error');
            throw error;
        }
    }

    // Access Token Management
    async function getAccessToken() {
        let accessToken = JSON.parse(sessionStorage.getItem('AccessToken')) || null;
        if (accessToken) {
            return accessToken;
        }

        if (!await validateConfig()) return null;

        const jwt = await createJwtToken();
        if (!jwt) {
            showToast('Failed to create JWT token', 'error');
            return null;
        }

        try {
            const response = await fetch(tokenUri, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    assertion: jwt,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get access token');
            }

            sessionStorage.setItem('AccessToken', JSON.stringify(data.access_token));
            return data.access_token;
        } catch (error) {
            console.error('Access token error:', error);
            showToast(`Access token error: ${error.message}`, 'error');
            return null;
        }
    }

    // Google Sheets'e link ekle
    async function saveToGoogleSheet(sheet, link, title, img, rank, age, tag, sales) {
        const accessToken = await getAccessToken();
        if(!accessToken) return;

        //const tags = tag.join(", ");
        // 1. Mevcut son dolu satırı bul
        let linkAlreadyExists = false;
        let lastRow = 0;
        await GM.xmlHttpRequest({
            method: "GET",
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${config.rangeLink}?majorDimension=COLUMNS`,
            headers: {
                "Authorization": `Bearer ${accessToken}`
            },
            onload: function(response) {
                if (response.status === 200) {
                    const data = JSON.parse(response.responseText);
                    if (data.values && data.values[0]) {
                        // Mevcut linklerle karşılaştır
                        if (data.values[0].includes(link)) {
                            linkAlreadyExists = true; // Link zaten mevcut
                        }
                    }
                    if (data.values && data.values.length > 0) {
                        lastRow = data.values[0].length; // En son dolu satır sayısını al
                    }
                } else {
                    sessionStorage.removeItem('AccessToken');
                    showToast("Veri alınırken hata oluştu:",'error');
                    console.error("Veri alınırken hata oluştu:", response.responseText);
                }
            },
            onerror: function(error) {
                sessionStorage.removeItem('AccessToken');
                console.error("GET isteği hatası:", error);
            }
        });

        // Eğer link zaten varsa, işlem yapılmasın ve uyarı verilsin
        if (linkAlreadyExists) {
            showToast(link + '\n zaten eklenmiş!','warning');
            //alert("Bu link zaten eklenmiş.");
            return; // İşlem sonlanır, link eklenmez
        }
        // 2. Linki en son satırın altına ekle
        const newRow = lastRow + 1;

        let body;

        if (config.rangeLink == "Liste!D:D") {
            body = {
                range: `Liste!D${newRow}:J${newRow}`,
                majorDimension: "ROWS",
                values: [[link, img, title, tag, null, sales, age]]
            };
        } else {
            body = {
                range: `Liste!F${newRow}:P${newRow}`,
                majorDimension: "ROWS",
                values: [[link, img, title, null, config.team, null, tag, null, null, sales, age]]
            };
        }

        await GM.xmlHttpRequest({
            method: "PUT",
            url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${body.range}?valueInputOption=RAW`,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            data: JSON.stringify(body),
            onload: function(response) {
                if (response.status === 200 || response.status === 201) {
                    showToast(link + '\n Başarıyla Eklendi');
                    console.log("Başarıyla eklendi:", link);
                    console.log("Başarıyla resim eklendi:", img);
                } else {
                    console.error("Ekleme hatası:", response.responseText);
                }
            },
            onerror: function(error) {
                console.error("PUT isteği hatası:", error);
            }
        });
    }

   // Google Sheets ve eRank işlemleri için aynı kodları kullandım.
    const fetchColumnData = async (sID=null) => {
        showToast('Veri alınıyor...', 'info');

        const accessToken = await getAccessToken();
        if (!accessToken) {
            showToast('Access token alınamadı', 'error');
            return;
        }

        let cacheKey;
        let sheet;
        if(sID && config.sheetId2){
            cacheKey = 'cachedData2';
            sheet = config.sheetId2;
        }else{
            cacheKey = 'cachedData';
            sheet = config.sheetId;
        }
        const cacheTimestampKey = `${cacheKey}_timestamp`;
        const now = Date.now();
        //console.log("cacheKeyFetch",cacheKey);
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        const cacheTimestamp = localStorage.getItem(cacheTimestampKey);

        if (cachedData && cacheTimestamp && now - parseInt(cacheTimestamp) < 1 * 60 * 60 * 1000) {
            return cachedData;
        }
        if (cachedData) { localStorage.removeItem(cacheKey) }


        await GM.xmlHttpRequest({
            method: "GET",
            url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${config.range}`,
            headers: {
                "Authorization": `Bearer ${accessToken}`
            },
            onload: function(response) {
                if (response.status === 200) {
                    const data = JSON.parse(response.responseText);
                    const processedData = data.values
                    .filter(row => row[0] != null && row[0] !== '') // row[0] boş değilse devam et
                    .map(row => ({
                        id: row[row.length - 1], // AD sütunu (son sütun)
                        dnoValue: row[0], // E sütunu (ilk sütun)
                        gDrive: row[row.length - 3], // AB gDrive serach
                    }));
                    localStorage.setItem(cacheKey, JSON.stringify(processedData));
                    localStorage.setItem(cacheTimestampKey, now.toString());
                    return { processedData };
                } else {
                    sessionStorage.removeItem('AccessToken');
                    showToast("Veri alınırken hata oluştu:",'error');
                    console.error("Veri alınırken hata oluştu:", response.responseText);
                }
            },
            onerror: function(error) {
                console.error("GET isteği hatası:", error);
            }
        });
    };

    const findEValueById = (id,sID=null) => {
        let cacheKey;
        if(sID){
            cacheKey = 'cachedData2';
        }else{
            cacheKey = 'cachedData';
        }
        //console.log("cacheKeyFind",cacheKey);
        const cachedData = JSON.parse(localStorage.getItem(cacheKey)) || [];
        const match = cachedData.find(row => row.id === id);
        const dnoValue = match ? match.dnoValue : null;
        const gDrive = match ? match.gDrive : null;
        //console.log("dnoValue",dnoValue);
        return {dnoValue, gDrive};
    };

    function simplifyAmazonUrl(asin) {
        try {
            return `https://www.amazon.com/dp/${asin}`;
        } catch (error) {
            console.error('Geçersiz URL:', error);
            return null;
        }
    }

    function convertToNumber(age) {
        // Virgülü kaldırıp noktaya çeviriyoruz
        let cleanedAge = age.replace(',', '');
        // Number ile dönüştürüyoruz
        let numericAge = parseInt(cleanedAge);
        // Sayı değilse bir hata mesajı verebiliriz
        if (isNaN(numericAge)) {
            console.error("Geçerli bir sayı değil:", age);
            return null;
        }
        return numericAge;
    }

    // Calculate days ago from a given date string
    function daysAgoFromDate(dateString) {
        // Convert the given date string to a date object
        const listingDate = new Date(dateString);
        // Get today's date
        const today = new Date();
        // Calculate the difference between the dates and return in days
        const differenceInTime = today.getTime() - listingDate.getTime();
        const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
        return listingDate;
    }

    function daysSince(str) {
        if(str.length<8){
            const myArray = str.split("/");
            str = myArray[0] + '/1/' + myArray[1]
        }
        //console.log("str: ", str);
        const startDate = new Date(str);
        const today = new Date();
        const timeDifference = today - startDate; // Zaman farkı milisaniye cinsinden
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Milisaniyeyi güne çevir
        return daysDifference;
    }

    // Using fetch
    async function downloadImage(imageSrc, title) {
        const image = await fetch(imageSrc)
        const imageBlog = await image.blob()
        const imageURL = URL.createObjectURL(imageBlog)

        const link = document.createElement('a')
        link.href = imageURL
        link.download = title
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
    // Copy a specified text to clipboard
    function copyText(textToCopy) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
            console.log('Text copied to clipboard:', textToCopy);
        })
            .catch(err => {
            console.error('Error copying text:', err);
        });
    }

    // Convert comma-separated number to normal number
    function convertCommaSeparatedNumber(commaSeparatedNumber) {
        return parseFloat(commaSeparatedNumber.replace(',', '.'));
    }

    function removeDuplicateTags(tagString) {
        return [...new Set(tagString.split(',').map(tag => tag.trim()))].join(', ');
    }

    function createHeartIcon(asin, url, title, img, rank, age, tag, sales) {
        let {dnoValue, gDrive} = findEValueById(asin) || ""; // Eğer değer bulunmazsa boş string
        const heartWrapper = document.createElement('div');
        const heart = document.createElement('span');
        heart.className = 'heart-icon';
        console.log(asin,dnoValue)
        heart.innerHTML = dnoValue ? "❤️" : "🤍";
        heart.title = dnoValue ? `Design NO: ${dnoValue} : ${title} - ${asin}` : `Add to List! ${title} - ${asin}`;
        heart.style.cursor = "no-drop";
        if (!dnoValue) {
            heart.style.cursor = "pointer";
            heart.addEventListener("click", async () => {
                heart.style.backgroundColor = "orange";
                //console.log(asin, url, title, img, rank, age);
                await saveToGoogleSheet(config.sheetId,url, title, img, rank, age, tag, sales);
                heart.textContent = "❤️";
                heart.style.backgroundColor = null;
            });
        }else if (gDrive) {
            heart.style.cursor = "alias";
            heart.addEventListener("click", async function() {
                window.open(gDrive, "_blank");
            });
        }

        heartWrapper.appendChild(heart);
        if(config.sheetId2){
            //console.log("var: ", config.sheetId2)
            let {dnoValue, gDrive} = findEValueById(asin,2) || ""; // Eğer değer bulunmazsa boş string
            //console.log("dnoValue2",dnoValue);
            const heart2 = document.createElement('span');
            heart2.className = 'heart-icon';
            heart2.innerHTML = dnoValue ? "✅" : "⭐";
            heart2.title = dnoValue ? `İstek NO: ${dnoValue}` : `İstek Yap!`;
            heart2.style.cursor = "no-drop";
            if (!dnoValue) {
                heart2.style.cursor = "pointer";
                heart2.addEventListener("click", async () => {
                    heart2.style.backgroundColor = "orange";
                    //console.log(asin, url, title, img, rank, age);
                    await saveToGoogleSheet(config.sheetId2,url, title, img, rank, age, tag, sales);
                    heart2.textContent = "✅";
                    heart2.style.backgroundColor = null;
                });
            }else if (gDrive) {
                heart2.style.cursor = "alias";
                heart2.addEventListener("click", async function() {
                    window.open(gDrive, "_blank");
                });
            }
            heartWrapper.appendChild(heart2);
        }

        return heartWrapper;
    }

    function addHearts() {
        const titleElement = document.querySelectorAll('.css-10mmn6v > tbody:nth-child(2) > tr > td:nth-child(1)');
        const imgElement = document.querySelectorAll('.css-10mmn6v > tbody:nth-child(2) > tr > td:nth-child(2) a > img');
        const asinElement = document.querySelectorAll('.css-10mmn6v > tbody:nth-child(2) > tr > td:nth-child(3)');
        const dateElement = document.querySelectorAll('.css-10mmn6v > tbody:nth-child(2) > tr > td:nth-child(6)');
        const rankElement = document.querySelectorAll('.css-10mmn6v > tbody:nth-child(2) > tr > td:nth-child(12)');

        asinElement.forEach((cell, index) => {
            if (!cell.querySelector('.heart-icon')) {
                let title = titleElement[index]?.textContent;
                let img = imgElement[index].src.replace('._SS60_.jpg', '').replace('._SS40_.jpg', '');
                let asin = cell?.textContent.trim();
                let date = dateElement[index]?.textContent.trim();
                let rank = convertToNumber(rankElement[index]?.textContent.trim());
                let age = daysSince(date);
                //console.log(date, age);
                let url = simplifyAmazonUrl(asin);
                const heart = createHeartIcon(asin, url, title, img, rank, age, null, null);
                cell.appendChild(heart);
            }
        });
    }

    function addHeartsProduct() {
        const details = document.querySelector("#detailBulletsWrapper_feature_div");
        // Date First Available
        const dateAvailableElement = [...details.querySelectorAll("li")]
        .find(el => el?.textContent.includes("Date First Available"));
        const dateAvailable = dateAvailableElement ? dateAvailableElement.innerText.split(":").pop().trim() : null;

        const bestSellerText = [...details.querySelectorAll("li")].find(el => el?.textContent.includes("Best Sellers Rank"))?.textContent;
        const bestSellerRank = bestSellerText?.match(/#([\d,]+)/)?.[1];

        const rank = parseInt(bestSellerRank.replace(/,/g, ''));
        const listingTitleElement = document.querySelector('#productTitle');
        const title = listingTitleElement?.textContent.trim();

        const reviewItemElement = document.querySelector("#acrCustomerReviewText");
        let review = "";
        if (reviewItemElement !== null) {
            var reviewCount = convertCommaSeparatedNumber(reviewItemElement?.textContent.trim());
            if (reviewCount > 10) {
                reviewCount = "★" + reviewCount;
            }
            review = '<p style="margin: 0;">Rev : ' + reviewCount + ' </p>';
        }

        const imgElement = document.querySelector('#imgTagWrapperId img');
        const img = imgElement ? imgElement.src : null;
        //console.log(img);
        var averageCustomerReviewsDiv = document.getElementById('averageCustomerReviews');
        var dataAsin = averageCustomerReviewsDiv ? averageCustomerReviewsDiv.getAttribute('data-asin'):null;
        const asin = dataAsin ? dataAsin : document.querySelector("#ASIN").value;
        let age = daysSince(dateAvailable);
        let url = simplifyAmazonUrl(asin);
        const heart = createHeartIcon(asin, url, title, img, rank, age, null, null);

        const balloonDiv = document.createElement("div");
        balloonDiv.setAttribute("id", "InfoBalloon");
        balloonDiv.innerHTML = `
        <div>
            Rank: ${rank}
            ${review}
            ${asin}
            <p style="margin: 0;">${dateAvailable}</p>
            <p style="margin: 0;">Days Ago: ${daysSince(dateAvailable)}</p>
            <button id="copy">Copy🗒️</button>
            <button title="Download Image" id="imgdownload">Img 🖼️</button>
        </div>
    `;

        // heart öğesini balloonDiv içine ekleyin
        balloonDiv.querySelector('div').appendChild(heart);

        document.body.appendChild(balloonDiv);
        document.getElementById("imgdownload").onclick = function () {
            downloadImage(img,title);
        };
        document.getElementById("copy").onclick = function () {
            copyText("Asin ID:" + asin + "\n" + title + "\n");
            showToast("Asin ID:" + asin + "\n" + title + "\n");
            console.log("Text copied to clipboard:\nListing ID:" + asin + "\n" + title + "\n");
        };
    }


    function addHeartsPodlyProduct() {
        const bestSellerRank = document.querySelector("#ProductDetails > div:nth-child(1) > div > div.w-full.pt-1\\.5.pl-6.middleBar > div.flex.justify-between.mt-4.min-h-20.dark\\:text-gray-30 > div:nth-child(3) > div.flex.mt-1 > div")?.textContent.trim();
        const rank = parseInt(bestSellerRank?.replace(/,/g, '').replace('#', ''));
        //console.log("rank: ", rank);
        const title = document.querySelector("#ProductDetails > div:nth-child(1) > div > div.w-full.pt-1\\.5.pl-6.middleBar > div.hidden.text-xl.text-gray-90.dark\\:text-white.sm\\:block > div > div")?.textContent.trim();
        //console.log("title: ", title);
        const imgElement = document.querySelector(".pd-img");
        const img = imgElement ? imgElement.src : null;
        //console.log(img);
        const sales = document.querySelector("#ProductDetails > div:nth-child(1) > div > div.w-full.pt-1\\.5.pl-6.middleBar > div.flex.justify-between.mt-6.dark\\:text-gray-30 > div:nth-child(5) > div > div.ml-1.dark\\:text-purple-10.small-fs")?.textContent;
        //console.log("salesElement: ",sales);
        const dateAvailable = document.querySelector("#ProductDetails > div:nth-child(1) > div > div.w-full.pt-1\\.5.pl-6.middleBar > div.flex.justify-between.mt-4.min-h-20.dark\\:text-gray-30 > div:nth-child(2) > div.flex.mt-1 > div")?.textContent;
        var asin = document.querySelector("#ProductDetails > div:nth-child(1) > div > div.w-full.pt-1\\.5.pl-6.middleBar > div.flex.justify-between.mt-4.min-h-20.dark\\:text-gray-30 > div:nth-child(1) > div.mt-1.small-fs.text-gray-40")?.textContent;
        //console.log("dataAsin1:",asin);
        const tags = Array.from(document.querySelectorAll('.keywords .Tag span')).map(tag => tag?.textContent).join(',');
        const tag =removeDuplicateTags(tags);
        //console.log("tags: ",tag);

        let age = daysSince(dateAvailable);
        let url = simplifyAmazonUrl(asin);

        const heart = createHeartIcon(asin, url, title, img, rank, age, tag, sales);

        const balloonDiv = document.createElement("div");
        balloonDiv.setAttribute("id", "InfoBalloon");
        balloonDiv.innerHTML = `
        <div>
            Rank: ${rank}
            ${asin}
            <p style="margin: 0;">${dateAvailable}</p>
            <p style="margin: 0;">Days Ago: ${daysSince(dateAvailable)}</p>
            <button id="copy">Copy🗒️</button>
            <button title="Download Image" id="imgdownload">Img 🖼️</button>
        </div>
    `;

        // heart öğesini balloonDiv içine ekleyin
        balloonDiv.querySelector('div').appendChild(heart);

        document.body.appendChild(balloonDiv);
        document.getElementById("imgdownload").onclick = function () {
            downloadImage(img,title);
        };
        document.getElementById("copy").onclick = function () {
            copyText("Asin ID:" + asin + "\n" + title + "\n");
            showToast("Text copied to clipboard:\nListing ID:" + asin + "\n" + title + "\n");
            console.log("Text copied to clipboard:\nListing ID:" + asin + "\n" + title + "\n");
        };
    }

    let globalProducts = [];
    function parseProductCard2(el) {
        const imgEl = el.querySelector(".img-wrapper img");
        const asin = el.querySelector(".rightBar.min-w-16.max-w-16.sm\\:min-w-48.sm\\:max-w-48.p-2.sm\\:p-4.border-l-1.border-purple-10.dark\\:border-darkPurple-60 > div.hidden.sm\\:flex.label-2.text-gray-40.dark\\:text-gray-20.uppercase.tracking-wider.cursor-pointer.items-center.break-all")?.textContent.replace(/ASIN\s*:/i, "").trim() || null;
        const ages = el.querySelector(".middleBar.pt-2.sm\\:pt-5.pb-2.pl-2.pr-6.w-full > div.tags.flex.sm\\:items-center.flex-col.sm\\:flex-row.sm\\:flex-wrap > div.text-gray-70.dark\\:text-white.items-center.hidden.sm\\:flex")?.textContent.trim() || null;
        const age = daysSince(ages);
        const bestSellerRank = el.querySelector(".ProductCardRow .leading-5.flex.items-center.h-8 span")?.textContent.trim() || null;
        const rank = parseInt(bestSellerRank?.replace(/,/g, '').replace('#', ''));
        const sales = el.querySelector(".middleBar.pt-2.sm\\:pt-5.pb-2.pl-2.pr-6.w-full > div.tags.flex.sm\\:items-center.flex-col.sm\\:flex-row.sm\\:flex-wrap > div:nth-child(6) > span")?.textContent.trim() || null;
        const tag = null;

        return {
            asin,
            url: simplifyAmazonUrl(asin),
            title: imgEl?.alt || null,
            img: imgEl?.src || null,
            rank,
            age,
            tag,
            sales
        };
    }

    function parseProductCard(el) {
        const imgEl = el.querySelector(".img-wrapper img");
        const match = imgEl.src.match(/\/I\/([A-Z0-9]{10,12})/i);
        const asin = match ? match[1].slice(0, 10).toUpperCase() : null;
        const ages =el.querySelector("div.dark\\:text-purple-10.text-gray-70.mt-6.ml-1.text-xs.text-center")?.textContent.trim() || null;
        const ageMatch = ages?.match(/(\d+)\s*days/);
        const age = ageMatch ? ageMatch[1] : null;
        const rank = el.querySelector(".ProductCardRow .leading-5.flex.items-center.h-8 span")?.textContent.trim() || null;
        const sales = el.querySelector(".ProductCard.t-shirt > div:nth-child(3) > div:nth-child(3) > span")?.textContent.trim() || null;
        return {
            asin,
            url: simplifyAmazonUrl(asin),
            title: imgEl?.alt || null,
            img: imgEl?.src || null,
            rank,
            age,
            tag: null,
            sales
        };
    }

    function addHeartsPodly2() {
        const productElements = document.querySelectorAll('.ProductCard2Container');

        productElements.forEach(el => {
            if (el.querySelector('.heart-icon')) return;
            const p = parseProductCard2(el);
            const target = el.querySelector('.ProductCard2.t-shirt');
            if (target) {
                const heart = createHeartIcon(...Object.values(p));
                target.appendChild(heart);
            } else {
                setTimeout(() => {
                    const retryTarget = el.querySelector('.ProductCard2.t-shirt');
                    if (retryTarget && !el.querySelector('.heart-icon')) {
                        const heart = createHeartIcon(...Object.values(p));
                        retryTarget.appendChild(heart);
                    }
                }, 300);
            }
            if (globalProducts.some(prod => prod.asin === p.asin)) return;

            globalProducts.push(p);
        });
    }

    function addHeartsPodly() {
        const productElements = document.querySelectorAll('.product-box-card-container');

        productElements.forEach(el => {
            if (el.querySelector('.heart-icon')) return;
            const p = parseProductCard(el);
            const target = el.querySelector('.ProductCard.t-shirt');
            if (target) {
                const heart = createHeartIcon(...Object.values(p));
                target.appendChild(heart);
            } else {
                setTimeout(() => {
                    const retryTarget = el.querySelector('.ProductCard.t-shirt');
                    if (retryTarget && !el.querySelector('.heart-icon')) {
                        const heart = createHeartIcon(...Object.values(p));
                        retryTarget.appendChild(heart);
                    }
                }, 4000);
            }
            if (globalProducts.some(prod => prod.asin === p.asin)) return;

            globalProducts.push(p);
        });
    }

    function observeProducts() {
        const container = document.querySelector('body'); // veya üst parent
        const observer = new MutationObserver(() => {
            const productElements2 = document.querySelector(".ProductCard2Container");
            const productElements = document.querySelector(".product-box-container");
            if (productElements2) addHeartsPodly2();
            //if (productElements) addHeartsPodly();
        });
        observer.observe(container, { childList: true, subtree: true });
    }

    await fetchColumnData();
    if(config.sheetId2!==""){
        await fetchColumnData(2);
    }

    async function Init() {
        if (window.location.href.includes("/dp/")) {
            addHeartsProduct();
        } else if (window.location.href.includes("podly")) {
            if (window.location.href.includes("search/products") || window.location.href.includes("product-search/trending-search")) {
                observeProducts();
            } else {
                addHeartsPodlyProduct();
            }
        } else {
            addHearts();
        }
    }

    // Initialize
    async function initialize() {
        // Load config
        await loadConfig();
        await Init();
        // Register menu commands
        GM.registerMenuCommand("Ayarlar", showConfigMenu);
        // Show welcome message
        showToast('Amazon Tool yüklendi', 'info');
    }

    // Start the script
    initialize();

})();
