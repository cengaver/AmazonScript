// ==UserScript==
// @name         Amazon Favotite
// @namespace    https://github.com/cengaver
// @version      0.22
// @description  Fvorite list a product on Amazon.
// @author       Cengaver
// @match        https://www.amazon.com/dp/*
// @match        https://sellercentral.amazon.com/opportunity-explorer/niche/*
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?domain=amazon.com
// @downloadURL  https://github.com/cengaver/AmazonScript/raw/refs/heads/main/AmazonFavorite.user.js
// @updateURL    https://github.com/cengaver/AmazonScript/raw/refs/heads/main/AmazonFavorite.user.js
// ==/UserScript==

GM_addStyle(`
  .heart-icon {
    cursor: pointer;
    color: red;
    margin-left: 5px;
  }
  .heart-icon:hover {
    transform: scale(1.2);
  }
`);

(function() {
    function addHearts() {
        const cells = document.querySelectorAll('.css-10mmn6v > tbody:nth-child(2) > tr > td:nth-child(3)');
        cells.forEach(cell => {
            if (!cell.querySelector('.heart-icon')) {
                const heart = document.createElement('span');
                heart.innerHTML = '❤️';
                heart.className = 'heart-icon';
                heart.onclick = () => {
                    alert(`Kalbe tıklandı: ${cell.textContent.trim()}`);
                    // Burada kendi fonksiyonunuzu çağırabilirsiniz
                };
                cell.appendChild(heart);
            }
        });
    }

    // Sayfa dinamikse gözlemci ekleyin
    const observer = new MutationObserver(addHearts);
    observer.observe(document.body, { childList: true, subtree: true });

    // İlk çalıştırma
    addHearts();
})();
