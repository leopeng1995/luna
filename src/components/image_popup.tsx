import React, { useState, useEffect, useRef } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from '@mui/material/CardActions';
import Button from "@mui/material/Button";
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { useTheme } from "@mui/material/styles";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Snackbar from '@mui/material/Snackbar';

const ctrl = new AbortController();

const ImagePopup = ({
  imageBase64,
  x = window.innerWidth / 2 - 300,  // Default to center horizontally
  y = window.innerHeight / 2 - 200,  // Default to center vertically
  onClose,
}: {
  imageBase64: string;
  x?: number;
  y?: number;
  onClose: () => void;
}) => {
  const [fetchData, setFetchData] = useState(""); // State to hold the fetched data
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const theme = useTheme();
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["apiKey"], function (result) {
      setApiKey(result.apiKey || "");
      if (result.apiKey && imageBase64) {
        postData(result.apiKey);
      }
    });
  }, [imageBase64]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onClose]);

  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = x;
      let newY = y;

      if (x + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width;
      }
      if (y + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height;
      }
      if (newX < 0) {
        newX = 0;
      }
      if (newY < 0) {
        newY = 0;
      }

      setPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  const postData = async (currentApiKey: string = apiKey) => {
    if (!currentApiKey) {
      setFetchData("错误：请先设置 API Key");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setFetchData(""); // Reset fetchData when starting a new request
      setHasError(false); // Reset error state

      await fetchEventSource('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentApiKey}`,
        },
        body: JSON.stringify({
          model: "glm-4v-plus",
          stream: true,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant."
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `${imageBase64}`
                  }
                },
                {
                  type: "text",
                  text: "请描述这张图片"
                }
              ]
            }
          ]
        }),
        signal: ctrl.signal,
        onopen: async (response: any) => {
          setFetchData("");
        },
        onmessage: async (event: any) => {
          let data = event.data;
          if (data === "[DONE]") return;

          let json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content || '';
          setFetchData(prevData => prevData + content);
        },
        onerror: (error: any) => {
          console.error("Error:", error);
          setFetchData("抱歉，获取图片描述时出现错误。");
          setHasError(true);
          setIsLoading(false);
        },
        onclose: () => {
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error("Error:", error);
      setFetchData("抱歉，获取图片描述时出现错误。");
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setDragStart({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    });
    setIsDragging(true);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  useEffect(() => {
    const ctrl = new AbortController();
    postData();
    return () => {
      ctrl.abort();
    };
  }, [imageBase64, hasError]);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(fetchData).then(() => {
      setSnackbarOpen(true);
    });
  };

  const handleSnackbarClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Card
      ref={popupRef}
      sx={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: 600,
        maxHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: theme.shadows[5],
        zIndex: 1000,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      <CardContent sx={{ flexGrow: 1, overflowY: "auto", padding: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={10}
          value={fetchData}
          variant="outlined"
          label="图片描述"
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 1 }}>
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyClick}
            size="small"
          >
            复制
          </Button>
        </Box>
        {isLoading && !hasError && (
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </CardContent>
      <CardActions sx={{
        display: "flex",
        justifyContent: "flex-end",
        padding: 2,
        borderTop: '1px solid rgba(0, 0, 0, 0.12)',
      }}>
        <Button
          onClick={onClose}
          size="small"
        >
          关闭
        </Button>
      </CardActions>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message="已复制到剪贴板"
      />
    </Card>
  );
};

export default ImagePopup;
