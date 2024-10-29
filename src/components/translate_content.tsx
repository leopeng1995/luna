import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Snackbar from '@mui/material/Snackbar';
import Button from "@mui/material/Button";
import { fetchEventSource } from '@microsoft/fetch-event-source';

const ctrl = new AbortController();

interface TranslateContentProps {
  activeTab: string;
  initialContent: string;
}

const TranslateContent: React.FC<TranslateContentProps> = ({ activeTab, initialContent }) => {
  const [sourceContent, setSourceContent] = useState(initialContent);
  const [targetContent, setTargetContent] = useState("loading...");
  const [src_lang, setSrcLang] = useState("en");
  const [tgt_lang, setTgtLang] = useState("zh-Hans");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["apiKey"], function (result) {
      setApiKey(result.apiKey || "");
      // 只有当有 apiKey 且当前是翻译标签时才执行翻译
      if (activeTab === 'translate' && result.apiKey && sourceContent) {
        translateText(sourceContent, src_lang, tgt_lang, result.apiKey);
      }
    });
  }, [activeTab]);

  const handleSourceContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSourceContent(event.target.value);
  };

  const translateText = (text: string, sourceLang: string, targetLang: string, currentApiKey: string = apiKey) => {
    if (!currentApiKey) {
      setTargetContent("错误：请先设置 API Key");
      return;
    }
    setTargetContent("loading...");
    try {
      fetchEventSource('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentApiKey}`,
        },
        body: JSON.stringify({
          model: "glm-4-air",
          stream: true,
          messages: [
            {
              role: "system",
              content: "You are a helpful translator."
            },
            {
              role: "user",
              content: `[${sourceLang}]: ${text}\n[${targetLang}]:`
            }
          ]
        }),
        signal: ctrl.signal,
        onopen: async (response: any) => {
          setTargetContent("")
        },
        onerror: (event: any) => {
          console.log(event);
        },
        onmessage: async (event: any) => {
          let data = event.data;
          if (data === "[DONE]") return;

          let json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content || '';

          setTargetContent((prevContent) => prevContent + content);
        }
      })
    } catch (error) {
      console.log(error);
      setTargetContent(`Error: ${error}`);
    }
  };

  const swapLanguages = () => {
    const newSrcLang = tgt_lang;
    const newTgtLang = src_lang;
    setSrcLang(newSrcLang);
    setTgtLang(newTgtLang);
    setSourceContent(targetContent);
    translateText(targetContent, newSrcLang, newTgtLang);
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(targetContent).then(() => {
      setSnackbarOpen(true);
    });
  };

  const handleSnackbarClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (activeTab !== 'translate') return null;

  return (
    <Box sx={{ fontSize: '14px', '& *': { fontSize: 'inherit' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <FormControl sx={{ width: '45%' }}>
          <InputLabel>源语言</InputLabel>
          <Select
            value={src_lang}
            onChange={(e) => setSrcLang(e.target.value as string)}
            label="源语言"
          >
            <MenuItem value="en">英语</MenuItem>
            <MenuItem value="zh-Hans">中文</MenuItem>
          </Select>
        </FormControl>
        <IconButton onClick={swapLanguages}>
          <SwapHorizIcon />
        </IconButton>
        <FormControl sx={{ width: '45%' }}>
          <InputLabel>目标语言</InputLabel>
          <Select
            value={tgt_lang}
            onChange={(e) => setTgtLang(e.target.value as string)}
            label="目标语言"
          >
            <MenuItem value="en">英语</MenuItem>
            <MenuItem value="zh-Hans">中文</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TextField
        fullWidth
        multiline
        rows={2}
        value={sourceContent}
        onChange={handleSourceContentChange}
        variant="outlined"
        label="源文本"
        sx={{ marginBottom: 2 }}
      />
      <Box sx={{ marginBottom: 2, fontWeight: 'bold', textAlign: 'center' }}>翻译结果</Box>
      <Box sx={{
        minHeight: '100px',
        maxHeight: '200px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        marginBottom: 1,
      }}>
        {targetContent}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          onClick={() => translateText(sourceContent, src_lang, tgt_lang)}
          size="small"
          variant="contained"
          color="primary"
        >
          翻译
        </Button>
        <Button
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyClick}
          size="small"
        >
          复制
        </Button>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message="已复制到剪贴板"
      />
    </Box>
  );
};

export default TranslateContent;
