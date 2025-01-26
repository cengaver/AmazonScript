// ==UserScript==
// @name         Amazon Image Hover Preview
// @namespace    https://github.com/cengaver
// @version      1.0
// @description  show large image preview on hover
// @author       Cengaver
// @icon         https://www.google.com/s2/favicons?domain=amazon.com
// @match        https://sellercentral.amazon.com/opportunity-explorer/search*
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
        previewDiv = document.createElement('div');
        previewDiv.className = 'hover-preview';
        document.body.appendChild(previewDiv);
    }

    function showPreview(event, imgUrl) {
        if (!previewDiv) createPreview();
        previewDiv.innerHTML = `<img src="${imgUrl}" alt="Preview">`;
        previewDiv.style.display = 'block';
        previewDiv.style.left = `${event.pageX + 10}px`;
        previewDiv.style.top = `${event.pageY + 10}px`;
    }

    function hidePreview() {
        if (previewDiv) previewDiv.style.display = 'none';
    }

    function handleHover(event) {
        const target = event.target;
        if (target.tagName === 'IMG' && target.src.includes('_SS40_')) {
            const largeImgUrl = target.src.replace('_SS40_', '_SS250_');
            showPreview(event, largeImgUrl);
        }
    }

    document.addEventListener('mouseover', handleHover);
    document.addEventListener('mousemove', (e) => {
        if (previewDiv && previewDiv.style.display === 'block') {
            previewDiv.style.left = `${e.pageX + 10}px`;
            previewDiv.style.top = `${e.pageY + 10}px`;
        }
    });
    document.addEventListener('mouseout', hidePreview);
})();
