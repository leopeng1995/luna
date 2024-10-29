chrome.runtime.onInstalled.addListener(() => {
  // receiving a message
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    console.log(
      sender.tab
        ? "from a content script:" + sender.tab.url
        : "from the extension"
    );
    if (request.greeting === "hello") sendResponse({ farewell: "goodbye" });
  });

  chrome.contextMenus.create({
    id: "translateText",
    title: "翻译选中文字",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "chatPage",
    title: "网页对话",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "illustrateImage",
    title: "图片理解",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "illustrateImage") {
    if (tab && tab.id && info.srcUrl) {
      // 获取图片的 base64 编码
      fetch(info.srcUrl)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = function() {
            const base64data = reader.result as string;
            // 发送 base64 数据到 content script
            chrome.tabs.sendMessage(tab.id!, {
              action: "illustrateImage",
              imageBase64: base64data,
            });
          }
          reader.readAsDataURL(blob);
        })
        .catch(error => {
          console.error("Error fetching image:", error);
        });
    }
  } else if (info.menuItemId === "chatPage") {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        contentUrl: info.pageUrl, 
        action: "chatPage" 
      });
    }
  }
});
