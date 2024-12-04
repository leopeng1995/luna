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

declare global {
  interface Window {
    translation: {
      canTranslate: (options: {
        sourceLanguage: string;
        targetLanguage: string;
      }) => Promise<string>;
      createTranslator: (options: {
        sourceLanguage: string;
        targetLanguage: string;
      }) => Promise<{
        translate: (text: string) => Promise<string>;
      }>;
    };
  }
  const translation: Window['translation'];
}

interface TranslateContentProps {
  activeTab: string;
  initialContent: string;
}

// 添加语言代码映射函数
const mapUILangToAPILang = (uiLang: string): string => {
  const langMap: { [key: string]: string } = {
    'zh-Hans': 'zh'
  };
  return langMap[uiLang] || uiLang;
};

const TranslateContent: React.FC<TranslateContentProps> = ({ activeTab, initialContent }) => {
  const [sourceContent, setSourceContent] = useState(initialContent);
  const [targetContent, setTargetContent] = useState("loading...");
  const [src_lang, setSrcLang] = useState("en");
  const [tgt_lang, setTgtLang] = useState("zh-Hans");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [translator, setTranslator] = useState<any>(null);

  useEffect(() => {
    // 只有当前是翻译标签时才初始化翻译器
    if (activeTab === 'translate' && sourceContent) {
      initTranslator(src_lang, tgt_lang).then(() => {
        translateText(sourceContent);
      });
    }
  }, [activeTab]);

  const initTranslator = async (sourceLang: string, targetLang: string) => {
    if (!window.translation) {
      console.error("window.translation 未定义");
      setTargetContent("错误：翻译服务未初始化");
      return false;
    }

    const languagePair = {
      sourceLanguage: mapUILangToAPILang(sourceLang),
      targetLanguage: mapUILangToAPILang(targetLang),
    };
  
    try {
      const canTranslate = await window.translation.canTranslate(languagePair);
      if (canTranslate !== 'no') {
        const newTranslator = await window.translation.createTranslator(languagePair);
        if (!newTranslator) {
          setTargetContent("错误：创建翻译器失败");
          return false;
        }
        setTranslator(newTranslator);
        return true;
      } else {
        setTargetContent("错误：当前语言对不支持翻译");
        return false;
      }
    } catch (error) {
      console.error("初始化翻译器失败:", error);
      setTargetContent(`Error: ${error}`);
      return false;
    }
  };

  const handleSourceContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSourceContent(event.target.value);
  };

  const translateText = async (text: string) => {
    if (!text) {
      setTargetContent("");
      return;
    }

    setTargetContent("loading...");
    try {
      // 确保每次翻译时都重新初始化翻译器
      const newTranslator = await window.translation.createTranslator({
        sourceLanguage: mapUILangToAPILang(src_lang),
        targetLanguage: mapUILangToAPILang(tgt_lang),
      });
      
      if (!newTranslator) {
        setTargetContent("错误：创建翻译器失败");
        return;
      }

      const translation = await newTranslator.translate(text);
      setTargetContent(translation);
    } catch (error) {
      console.error("翻译失败:", error);
      setTargetContent(`翻译失败: ${error}`);
    }
  };

  const swapLanguages = async () => {
    const newSrcLang = tgt_lang;
    const newTgtLang = src_lang;
    setSrcLang(newSrcLang);
    setTgtLang(newTgtLang);
    setSourceContent(targetContent);
    
    // 重新初始化翻译器并翻译
    await initTranslator(newSrcLang, newTgtLang);
    translateText(targetContent);
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

  const handleLanguageChange = async (type: 'source' | 'target', value: string) => {
    if (type === 'source') {
      setSrcLang(value);
    } else {
      setTgtLang(value);
    }
    
    // 重新初始化翻译器
    await initTranslator(
      type === 'source' ? value : src_lang,
      type === 'target' ? value : tgt_lang
    );
    // 如果有源文本，则立即翻译
    if (sourceContent) {
      translateText(sourceContent);
    }
  };

  if (activeTab !== 'translate') return null;

  return (
    <Box sx={{ fontSize: '14px', '& *': { fontSize: 'inherit' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <FormControl sx={{ width: '45%' }}>
          <InputLabel>源语言</InputLabel>
          <Select
            value={src_lang}
            onChange={(e) => handleLanguageChange('source', e.target.value as string)}
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
            onChange={(e) => handleLanguageChange('target', e.target.value as string)}
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
          onClick={() => translateText(sourceContent)}
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
