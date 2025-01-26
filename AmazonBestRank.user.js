// ==UserScript==
// @name         Amazon BestRank
// @namespace    https://github.com/cengaver
// @version      0.22
// @description  Displays the listing date and favorite count of a product on Amazon.
// @author       Cengaver
// @match        https://www.amazon.com/dp/*
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?domain=amazon.com
// @downloadURL  https://github.com/cengaver/AmazonScript/raw/refs/heads/main/AmazonBestRank.user.js
// @updateURL    https://github.com/cengaver/AmazonScript/raw/refs/heads/main/AmazonBestRank.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Calculate days ago from a given date string
    function daysAgoFromDate(dateString) {
        // Convert the given date string to a date object
        const listingDate = new Date(dateString);
        // Get today's date
        const today = new Date();
        // Calculate the difference between the dates and return in days
        const differenceInTime = today.getTime() - listingDate.getTime();
        const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
        return differenceInDays;
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

    // Check if we are on a product page
    if (window.location.href.indexOf("amazon.com/dp/") !== -1) {
        const listingDateElement = document.querySelector('#detailBullets_feature_div > ul > li:nth-child(3) > span > span:nth-child(2)');
        const listingDate = listingDateElement ? listingDateElement.textContent.trim() : '';

        const bestsellerrankElement = document.querySelector("#detailBulletsWrapper_feature_div > ul:nth-child(4) > li > span")
        let rank = 0;
        if (bestsellerrankElement) {
            const bestsellerrankText = bestsellerrankElement.textContent.trim();
            const match = bestsellerrankText.match(/#([\d,]+)/);
            rank = match ? parseInt(match[1].replace(/,/g, '')) : null;
            console.log(rank); // Çıktı: 17525
        }

        const listingTitleElement = document.querySelector('#productTitle');
        const listingTitle = listingTitleElement.textContent.trim();

        // title and tag text includen sheet
        listingTitleElement.innerHTML = `
            ${listingTitleElement.textContent}<br><hr><div class="wt-bg-turquoise-tint wt-text-gray wt-text-caption wt-pt-xs-1 wt-pb-xs-1">${listingTitle}</div>
        `;
        if (listingDate) {
            console.log("Listing Date: " + listingDate);
            //console.log("Favorite Count: " + favoriteCount);
            console.log("Title: " + listingTitle);

            const reviewItemElement =document.querySelector("#acrCustomerReviewText")
            let review ="";
            if (reviewItemElement!== null){
                var reviewCount = convertCommaSeparatedNumber(reviewItemElement.textContent.trim());
            if (reviewCount > 10) {
                reviewCount = "★" + reviewCount;
            }
                review = '<p style="margin: 0;">Rev : '+reviewCount+' </p>'
                console.log("ReviewItem: " + reviewCount);
            }

            const balloonDiv = document.createElement("div");
            balloonDiv.setAttribute("id", "InfoBalloon");
            balloonDiv.innerHTML = `
                <div style="position: fixed; top: 60px; left: 90%; transform: translateX(-50%); background-color: yellow; border: 1px solid #ccc; border-radius: 5px; padding: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); z-index: 9999;">
                     Rank :${rank}
                     ${review}
                    <p style="margin: 0;">${listingDate}</p>
                    <p style="margin: 0;">Days Ago : ${daysAgoFromDate(listingDate)}</p>
                    <button id="copy">Copy</button>
                </div>
            `;
            document.body.appendChild(balloonDiv);

            const AsinElement = document.querySelector("#ASIN");
            let Asin;
            if(AsinElement){
                Asin = AsinElement.value;
                console.log("Asin ID:", Asin);
            }

            const imgElement = document.querySelector('#imgTagWrapperId img');
            const imgSrc = imgElement ? imgElement.src : null;
            console.log(imgSrc); // Çıktı: https://m.media-amazon.com/images/I/71v8VB19+LL._AC_SY741_.jpg

            document.getElementById("copy").onclick = function(){
                copyText("Asin ID:"+Asin+"\n"+listingTitle+"\n")
                console.log("Text copied to clipboard:\nListing ID:"+Asin+"\n"+listingTitle+"\n");
            }
        }
    }
})();
