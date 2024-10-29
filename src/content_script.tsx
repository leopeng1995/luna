import React, { CSSProperties, useState } from "react";
import { createRoot, Root } from "react-dom/client";

import { TranslatePopup, ImagePopup, ChatPopup } from "./components";

let root: Root | null = null; // 声明一个全局的 root 变量

// 创建通用的弹窗容器工具函数
const createPopupContainer = () => {
  const container = document.createElement("div");
  container.style.position = 'fixed';
  container.style.zIndex = '99999';
  container.style.left = '0';
  container.style.top = '0';
  document.body.appendChild(container);
  return { container, root: createRoot(container) };
};

const ThumbIcon = ({ text, x, y }: { text: string; x: number; y: number }) => {
  const [popupState, setPopupState] = useState<{
    visible: boolean;
    container: HTMLDivElement | null;
    root: Root | null;
  }>({
    visible: false,
    container: null,
    root: null
  });

  const iconStyle: CSSProperties = {
    position: "fixed",
    left: `${x}px`,
    top: `${y}px`,
    width: "20px",
    height: "20px",
    background: "#fff",
    padding: "2px",
    borderRadius: "4px",
    boxShadow: "0 0 4px rgba(0,0,0,0.2)",
    cursor: "pointer",
    userSelect: "none",
    zIndex: "99999",   // 添加较高的 z-index 确保图标在最上层
  };

  const imgStyle: CSSProperties = {
    display: "block",
    width: "100%",
    height: "100%",
    cursor: 'pointer',  // 给图片也添加 cursor: pointer
  };


  const handleClick = () => {
    if (!popupState.visible) {
      try {
        const { container, root } = createPopupContainer();
        setPopupState({ visible: true, container, root });

        root.render(
          <TranslatePopup
            content={text}
            x={x + 25}
            y={y}
            onClose={() => {
              root.unmount();
              container.remove();
              setPopupState({ visible: false, container: null, root: null });
            }}
          />
        );
      } catch (error) {
        console.error('Failed to create popup:', error);
      }
    } else if (popupState.root && popupState.container) {
      popupState.root.unmount();
      popupState.container.remove();
      setPopupState({ visible: false, container: null, root: null });
    }
  };

  return (
    <div
      style={iconStyle}
      title={text}
      onClick={handleClick}
      onMouseOver={(e) => { e.currentTarget.style.cursor = 'pointer' }}  // 添加鼠标悬停事件
    >
      <img
        src="https://dss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/topnav/newxueshuicon-a5314d5c83.png"
        alt="Thumb Icon"
        style={imgStyle}
      />
    </div>
  );
};

// 优化选择文本处理函数
const handleSelectionChange = (event: MouseEvent) => {
  const SELECTION_DELAY = 10;

  setTimeout(() => {
    try {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText) {
        const { x, y } = event;
        let thumbIcon = document.getElementById('thumb-icon');

        if (!thumbIcon) {
          thumbIcon = document.createElement("div");
          thumbIcon.id = "thumb-icon";
          document.body.appendChild(thumbIcon);
        }

        if (!root) {
          root = createRoot(thumbIcon);
        }

        root.render(<ThumbIcon text={selectedText} x={x} y={y} />);
      } else {
        cleanupThumbIcon();
      }
    } catch (error) {
      console.error('Selection handling error:', error);
      cleanupThumbIcon();
    }
  }, SELECTION_DELAY);
};

// 提取清理函数
const cleanupThumbIcon = () => {
  const thumbIcon = document.getElementById("thumb-icon");
  if (thumbIcon && root) {
    root.unmount();
    thumbIcon.remove();
    root = null;
  }
};

// 优化消息处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    const { container, root } = createPopupContainer();
    const closePopup = () => {
      root.unmount();
      container.remove();
      sendResponse({ status: `${message.action} Popup closed` });
    };

    switch (message.action) {
      case "illustrateImage":
        root.render(<ImagePopup imageBase64={message.imageBase64} onClose={closePopup} />);
        break;
      case "chatPage":
        root.render(<ChatPopup contentUrl={message.contentUrl} onClose={closePopup} />);
        break;
      default:
        console.warn(`Unknown action: ${message.action}`);
    }
  } catch (error: unknown) {
    console.error('Message handling error:', error);
    sendResponse({
      status: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
  return true;
});

function main() {
  document.addEventListener("mouseup", handleSelectionChange);
}

main();
