// ==UserScript==
// @name         Amazon Favorite
// @namespace    https://github.com/cengaver
// @version      1.31
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

(async function () {
    "use strict";

    GM.registerMenuCommand("sheetId", async () => {
        const sheetId = prompt("Lütfen sheetId girin:", await GM.getValue("sheetId", ""));
        if (sheetId) await GM.setValue("sheetId", sheetId);
    });

    const getApiConfig = async () => {
        const sheetId = await GM.getValue('sheetId', '');
        const sheetId2 = await GM.getValue('sheetId2', '');
        const range = await GM.getValue('range', 'Liste!E:AD');
        const rangeLink = await GM.getValue('rangeLink', '');
        const privateKey = await GM.getValue('privateKey', '');
        const clientEmail = await GM.getValue('clientEmail', '');
        const team = await GM.getValue('team', '');
        try {
            if (!sheetId) {
                alert("sheetId ayarlanmamış.");
                return null;
            }
             return { sheetId, sheetId2, range, rangeLink, privateKey, clientEmail, team };
        } catch (e) {
            alert("Bilgiler uygun değil!");
            return null;
        }
    };

    const config = await getApiConfig();
    if (!config) return;

    const { sheetId, sheetId2, range, rangeLink, privateKey, clientEmail, team } = config;

    const tokenUri = "https://oauth2.googleapis.com/token";

    // Step 1: Generate JWT Token
    async function createJwtToken(clientEmail, privateKey) {
        const header = {
            alg: "RS256",
            typ: "JWT",
        };

        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iss: clientEmail,
            scope: "https://www.googleapis.com/auth/spreadsheets", // Adjust scope as needed
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
        const signature = await signWithPrivateKey(toSign, privateKey);

        return `${toSign}.${signature}`;
    }

    // Helper: Sign the JWT using the private key (RS256)
    async function signWithPrivateKey(data, privateKey) {
        const crypto = window.crypto.subtle || window.crypto.webkitSubtle;

        // Convert private key into a format compatible with Web Crypto API
        const importKeyPromise = crypto.importKey(
            "pkcs8",
            pemToArrayBuffer(privateKey),
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            false,
            ["sign"]
        );

        return await importKeyPromise
            .then((key) => crypto.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(data)))
            .then((signature) => btoa(String.fromCharCode(...new Uint8Array(signature)))
                  .replace(/=/g, "")
                  .replace(/\+/g, "-")
                  .replace(/\//g, "_"));
    }

    // Helper: Convert PEM private key to ArrayBuffer
    function pemToArrayBuffer(pem) {
        const base64 = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, "")
        .replace(/-----END PRIVATE KEY-----/, "")
        .replace(/\n/g, "");
        //console.log(base64);
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Step 2: Exchange JWT for OAuth Access Token
    async function getAccessToken(e) {
        let AccToken = JSON.parse(sessionStorage.getItem('AccessToken')) || null;
        if(AccToken){
            return AccToken
        }
        const jwt = await createJwtToken(clientEmail, privateKey);

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
        sessionStorage.setItem('AccessToken', JSON.stringify(data.access_token));
        return data.access_token;
    }

    // Google Sheets'e link ekle
    async function saveToGoogleSheet(sheet, link, title, img, rank, age, tag, sales) {
        const accessToken = await getAccessToken();
        //const tags = tag.join(", ");
        // 1. Mevcut son dolu satırı bul
        let linkAlreadyExists = false;
        let lastRow = 0;
        await GM.xmlHttpRequest({
            method: "GET",
            url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${rangeLink}?majorDimension=COLUMNS`,
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
            alert("Bu link zaten eklenmiş.");
            return; // İşlem sonlanır, link eklenmez
        }
        // 2. Linki en son satırın altına ekle
        const newRow = lastRow + 1;

        let body;

        if (rangeLink == "Liste!D:D") {
            body = {
                range: `Liste!D${newRow}:J${newRow}`,
                majorDimension: "ROWS",
                values: [[link, img, title, tag, sales, rank, age]]
            };
        } else {
            body = {
                range: `Liste!F${newRow}:P${newRow}`,
                majorDimension: "ROWS",
                values: [[link, img, title, null, team, null, tag, null, sales, rank, age]]
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
        const config = await getApiConfig();
        if (!config) return;

        const { sheetId, sheetId2, range } = config;
        let cacheKey;
        let sheet;
        if(sID && sheetId2){
            cacheKey = 'cachedData2';
            sheet = sheetId2;
        }else{
            cacheKey = 'cachedData';
            sheet = sheetId;
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

        const accessToken = await getAccessToken();

        await GM.xmlHttpRequest({
            method: "GET",
            url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${range}`,
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
        heart.innerHTML = dnoValue ? "❤️" : "🤍";
        heart.title = dnoValue ? `Design NO: ${dnoValue}` : `Add to List!`;
        heart.style.cursor = "no-drop";
        if (!dnoValue) {
            heart.style.cursor = "pointer";
            heart.addEventListener("click", async () => {
                heart.style.backgroundColor = "orange";
                //console.log(asin, url, title, img, rank, age);
                await saveToGoogleSheet(sheetId,url, title, img, rank, age, tag, sales);
                heart.textContent = "❤️";
                showToast(asin + '\n Başarıyla Eklendi');
                heart.style.backgroundColor = null;
            });
        }else if (gDrive) {
            heart.style.cursor = "alias";
            heart.addEventListener("click", async function() {
                window.open(gDrive, "_blank");
            });
        }

        heartWrapper.appendChild(heart);

        if(sheetId2){
            let {dnoValue, gDrive} = findEValueById(asin,2) || ""; // Eğer değer bulunmazsa boş string
            //console.log("dnoValue2",dnoValue);
            const heart2 = document.createElement('span');
            heart2.className = 'heart-icon';
            heart2.innerHTML = dnoValue ? "|✅" : "|⭐";
            heart2.title = dnoValue ? `İstek NO: ${dnoValue}` : `İstek Yap!`;
            heart2.style.cursor = "no-drop";
            if (!dnoValue) {
                heart2.style.cursor = "pointer";
                heart2.addEventListener("click", async () => {
                    heart2.style.backgroundColor = "orange";
                    //console.log(asin, url, title, img, rank, age);
                    await saveToGoogleSheet(sheetId2,url, title, img, rank, age, tag, sales);
                    heart2.textContent = "✅";
                    showToast(asin + '\n Başarıyla Eklendi');
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
                let title = titleElement[index].textContent;
                let img = imgElement[index].src.replace('._SS60_.jpg', '').replace('._SS40_.jpg', '');
                let asin = cell.textContent.trim();
                let date = dateElement[index].textContent.trim();
                let rank = convertToNumber(rankElement[index].textContent.trim());
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
        .find(el => el.textContent.includes("Date First Available"));
        const dateAvailable = dateAvailableElement ? dateAvailableElement.innerText.split(":").pop().trim() : null;

        const bestSellerText = [...details.querySelectorAll("li")].find(el => el.textContent.includes("Best Sellers Rank"))?.textContent;
        const bestSellerRank = bestSellerText?.match(/#([\d,]+)/)?.[1];

        const rank = parseInt(bestSellerRank.replace(/,/g, ''));
        const listingTitleElement = document.querySelector('#productTitle');
        const title = listingTitleElement.textContent.trim();

        const reviewItemElement = document.querySelector("#acrCustomerReviewText");
        let review = "";
        if (reviewItemElement !== null) {
            var reviewCount = convertCommaSeparatedNumber(reviewItemElement.textContent.trim());
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
        const bestSellerRank = document.querySelector("#ProductDetails > div:nth-child(1) > div > div.w-full.pt-1\\.5.pl-6.middleBar > div.flex.justify-between.mt-4.min-h-20.dark\\:text-gray-30 > div:nth-child(3) > div.flex.mt-1 > div").textContent.trim();
        const rank = parseInt(bestSellerRank.replace(/,/g, '').replace('#', ''));
        //console.log("rank: ", rank);
        const title = document.querySelector("#ProductDetails > div:nth-child(1) > div > div.w-full.pt-1\\.5.pl-6.middleBar > div.hidden.text-xl.text-gray-90.dark\\:text-white.sm\\:block > div > div").textContent.trim();
        //console.log("title: ", title);
        const imgElement = document.querySelector(".pd-img");
        const img = imgElement ? imgElement.src : null;
        //console.log(img);
        const sales = document.querySelector("#ProductDetails > div:nth-child(1) > div > div.w-full.pt-1\\.5.pl-6.middleBar > div.flex.justify-between.mt-6.dark\\:text-gray-30 > div:nth-child(5) > div > div.ml-1.dark\\:text-purple-10.small-fs").textContent;
        //console.log("salesElement: ",sales);
        const dateAvailable = document.querySelector("#ProductDetails > div:nth-child(1) > div > div.w-full.pt-1\\.5.pl-6.middleBar > div.flex.justify-between.mt-4.min-h-20.dark\\:text-gray-30 > div:nth-child(2) > div.flex.mt-1 > div").textContent;
        var asin = document.querySelector("#ProductDetails > div:nth-child(1) > div > div.w-full.pt-1\\.5.pl-6.middleBar > div.flex.justify-between.mt-4.min-h-20.dark\\:text-gray-30 > div:nth-child(1) > div.mt-1.small-fs.text-gray-40").textContent;
        //console.log("dataAsin1:",asin);
        const tags = Array.from(document.querySelectorAll('.keywords .Tag span')).map(tag => tag.textContent).join(',');
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

    function addHeartsPodly() {
        const productElement = document.querySelectorAll('.product-box-container')

        productElement.forEach((el, index) => {
            if (!el.querySelector('.heart-icon')) {
                /*let title = titleElement[index].textContent;
                let img = imgElement[index].src.replace('._SS60_.jpg', '').replace('._SS40_.jpg', '');
                let asin = el.textContent.trim();
                let date = dateElement[index].textContent.trim();
                let rank = convertToNumber(rankElement[index].textContent.trim());
                let age = daysSince(date);
                //console.log(date, age);
                let url = simplifyAmazonUrl(asin);
                const heart = createHeartIcon(asin, url, title, img, rank, age, null, null);
                el.appendChild(heart);*/
            }
        });
    }

    function showToast(message, type = null) {
        const toast = document.createElement('div');
        if (type == 'error') {
            toast.className = 'toast-error';
        }else{
            toast.className = 'toast';
        }
        toast.innerText = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // Mutation Observer to prevent infinite loops
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                if ( window.location.href.includes("search/products") || window.location.href.includes("product-search/trending-search") ) {
                    addHeartsPodly();
                } else {
                    addHearts();
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    await fetchColumnData();
    if(sheetId2!==""){
        await fetchColumnData(2);
    }

    // Initial call based on the current page
    if (window.location.href.includes("/dp/")) {
        addHeartsProduct();
    }else if (window.location.href.includes("podly")) {
        if( window.location.href.includes("search/products") || window.location.href.includes("product-search/trending-search")){
            addHeartsPodly();
        }else{
            addHeartsPodlyProduct()
        }
    } else {
        addHearts();
    }

    GM.addStyle(`
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
     }
     .heart-icon:hover {
       transform: scale(1.2);
     }
    .toast-error {
            visibility: hidden;
            min-width: 250px;
            background-color: #ff0000;
            color: white;
            text-align: center;
            border-radius: 5px;
            padding: 16px;
            position: fixed;
            z-index: 1001;
            bottom: 100px;
            right: 30px;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.5s, visibility 0.5s;
        }
        .toast {
            visibility: hidden;
            min-width: 250px;
            background-color: #4CAF50;
            color: white;
            text-align: center;
            border-radius: 5px;
            padding: 16px;
            position: fixed;
            z-index: 1001;
            bottom: 100px;
            right: 30px;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.5s, visibility 0.5s;
        }
        .toast-error.show {
            visibility: visible;
            opacity: 1;
        }
        .toast.show {
            visibility: visible;
            opacity: 1;
        }

 `);
})();
