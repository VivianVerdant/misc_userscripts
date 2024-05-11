// ==UserScript==
// @name         Better Pinterest
// @namespace    https://github.com/VivianVerdant/misc_userscripts
// @version      1.0
// @license      AGPLv3
// @description  Changes all Pinterest hosted images to use the raw/original version or largest available and open links in new tab
// @author       VivianVerdant
// @match        https://*.pinterest.com/*
// @grant        GM_openInTab
// @grant        GM_addStyle
// @run-at       document-start
// @downloadURL  https://github.com/VivianVerdant/misc_userscripts/raw/main/better_pinterest.user.js
// @updateURL    https://github.com/VivianVerdant/misc_userscripts/raw/main/better_pinterest.user.js
// ==/UserScript==

(function() {

    const css = `
        [data-test-id="fullPageSignupModal"],
        [data-test-id="bottom-right-upsell"],
        [data-test-id="more-like-this-button"],
        [data-test-id="visual-search-icon"],
        [data-test-id="pin-closeup-image"] > div:has([data-test-id="main-pin-hover-overlay"]) {
	        display: none;
        }`

    GM_addStyle(css)

    function getAncestorLink(element) {
        while (element && element.nodeName != "A") {
            element = element.parentNode;
        }
        if (element && element.nodeName && element.nodeName === "A" && element.href && element.href.indexOf('http') === 0) {
            return element;
        }
    }

    String.prototype.matched = function(strings) {
        for (var i = 0; i < strings.length; i++) {
            if (typeof strings[i] == 'string' && this.indexOf(strings[i]) === 0) {
                return true;
            }
            else if (strings[i] instanceof RegExp && strings[i].test(this)) {
                return true;
            }
        }
        return false;
    };

    var setLinkAction = function(node) {
        if (node && !node.hasAttribute('setted') && node.nodeName && node.nodeName === "A" && node.href && node.href.indexOf('http') === 0) {
            node.setAttribute('setted', '');
            node.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (this && this.href && !/^(\d+|Next|Prev|>|<|下一页|上一页|下一頁|上一頁|回首頁|次へ|前へ)$/.test(this.innerText)) {
                    console.log(this, e.target);
                    window.open(this.href);
                } else {
                    location.href = this.href;
                }
            });
        }
    };

    for (var i = 0; i < document.getElementsByTagName("A").length; i++) {
        setLinkAction(document.getElementsByTagName("A")[i]);
    }
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    if (MutationObserver) {
        var observer = new MutationObserver(function(records) {
            records.map(function(record) {
                setLinkAction(record.target);
                for (var i = 0; i < record.target.getElementsByTagName("A").length; i++) {
                    setLinkAction(record.target.getElementsByTagName("A")[i]);
                }
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    var regex = /^(https?:\/\/i\.pinimg\.com)\/\d+x(\/[0-9a-f]{2}\/[0-9a-f]{2}\/[0-9a-f]{2}\/[0-9a-f]{32}\.(?:jpg|png))$/;

    function setSrc(ele, url) {
        if (url) {
            ele.utri_skip = 1;
            if (ele.getAttribute("data-src") === ele.src) ele.setAttribute("data-src", url);
            ele.src = url;
        }
    }

    function tryLoad(ele, url1, url2, i, m, e) {
        i = document.createElement("IMG");
        i.onerror = function() {
            if (i.src === url1) {
                setSrc(i, url2);
            } else {
                i.remove();
                e.remove();
            }
        };
        i.onload = function() {
            setSrc(ele, i.src);
            i.remove();
            e.remove();
        };
        i.style.cssText = "position:absolute;z-index:-9999;opacity:.1;visibility:hidden;left:-9999px;top:-9999px;width:1px;height:1px";
        setSrc(i, url1);
        e = document.createElement("DIV");
        e.utri_skip = 1;
        e.textContent = "Optimizing...";
        e.style.cssText = "position:absolute;z-index:9;border-bottom-right-radius:1rem;padding:.1em 2.5ex .2em 2ex;background:#000;color:#fff;line-height:normal;font-size:8pt;font-weight:normal";
        ele.parentNode.insertBefore(e, ele);
        document.body.appendChild(i);
    }

    function processSrc(ele, match) {
        if ((ele.tagName !== "IMG") || !ele.src || ele.utri_skip) return;
        if (match = ele.src.match(regex)) tryLoad(ele, match[1] + "/originals" + match[2], match[1] + "/736x" + match[2]);
    }

    function processContainer(container, eles) {
        if (container.nodeType !== Node.ELEMENT_NODE) return;
        eles = container.querySelectorAll('img[src^="https://i.pinimg.com/"]');
        processSrc(container);
        eles.forEach(processSrc);
    }

    addEventListener("load", function() {
        processContainer(document.body);
        (new MutationObserver(function(records) {
            records.forEach(function(record) {
                if (record.attributeName === "src") {
                    processSrc(record.target);
                } else record.addedNodes.forEach(processContainer);
            });
        })).observe(document.body, { childList: true, attributes: true, subtree: true });
    });

})();
