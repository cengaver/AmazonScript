// ==UserScript==
// @name         Amazon Image Hover Preview
// @namespace    https://github.com/cengaver
// @version      1.41
// @description  show large image preview on hover, supports lazy-loaded images
// @author       Cengaver
// @icon         https://www.google.com/s2/favicons?domain=amazon.com
// @match        https://sellercentral.amazon.com/opportunity-explorer/*
// @match        https://www.amazon.com/gp/*
// @match        https://www.amazon.com/Best-Sellers*
// @match        https://advertising.amazon.com/cm/sp/*
// @downloadURL  https://github.com/cengaver/AmazonScript/raw/refs/heads/main/AmazonImageHoverPreview.user.js
// @updateURL    https://github.com/cengaver/AmazonScript/raw/refs/heads/main/AmazonImageHoverPreview.user.js
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
  .hover-preview {
    position: absolute;
    z-index: 1000;
    border: 2px solid #ccc;
    background: #fff;
    padding: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    display: none;
  }
  .hover-preview img {
    max-width: 400px;
    max-height: 400px;
  }
`);

(function() {
    let previewDiv;

    function createPreview() {
        if (!previewDiv) {
            previewDiv = document.createElement('div');
            previewDiv.className = 'hover-preview';
            document.body.appendChild(previewDiv);
        }
    }

    function showPreview(event, imgUrl) {
        createPreview();
        previewDiv.innerHTML = `<img src="${imgUrl}" alt="Preview">`;
        previewDiv.style.display = 'block';
        previewDiv.style.left = `${event.pageX + 10}px`;
        previewDiv.style.top = `${event.pageY + 10}px`;
    }

    function hidePreview() {
        if (previewDiv) previewDiv.style.display = 'none';
    }

    document.addEventListener('mouseover', (event) => {
        const target = event.target;
        if ( target.tagName === 'IMG' && target.src.includes('_SS40_') ) {
            const largeImgUrl = target.src.replace('_SS40_', '_SS250_');
            showPreview(event, largeImgUrl);
        } else if ( target.tagName === 'IMG' && target.src.includes('_AC_UL') ) {
            let largeImgUrl = target.src.replace('UL600_SR600,400', 'UL900_SR900,800');
            largeImgUrl = largeImgUrl.replace('UL300_SR300,200', 'UL900_SR900,800');
            largeImgUrl = largeImgUrl.replace('UL165_SR165,165', 'UL900_SR900,800');
            largeImgUrl = largeImgUrl.replace('UL100_SR100,100', 'UL900_SR900,800');
            showPreview(event, largeImgUrl);
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (previewDiv && previewDiv.style.display === 'block') {
            previewDiv.style.left = `${e.pageX + 10}px`;
            previewDiv.style.top = `${e.pageY + 10}px`;
        }
    });

    document.addEventListener('mouseout', (event) => {
        if (event.target.tagName === 'IMG') {
            hidePreview();
        }
    });
})();
