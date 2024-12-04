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

interface TranslateContentProps {
  activeTab: string;
  initialContent: string;
}

// Add language code mapping function
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
    // Only initialize the translator when the current tab is the translate tab
    if (activeTab === 'translate' && sourceContent) {
      initTranslator(src_lang, tgt_lang).then(() => {
        translateText(sourceContent);
      });
    }
  }, [activeTab]);

  const initTranslator = async (sourceLang: string, targetLang: string) => {
    if (!window.translation) {
      console.error("window.translation is not defined");
      setTargetContent("Error: Translation service not initialized");
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
          setTargetContent("Error: Failed to create translator");
          return false;
        }
        setTranslator(newTranslator);
        return true;
      } else {
        setTargetContent("Error: Current language pair is not supported");
        return false;
      }
    } catch (error) {
      console.error("Failed to initialize translator:", error);
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
      // Ensure the translator is reinitialized each time translation is performed
      const newTranslator = await window.translation.createTranslator({
        sourceLanguage: mapUILangToAPILang(src_lang),
        targetLanguage: mapUILangToAPILang(tgt_lang),
      });
      
      if (!newTranslator) {
        setTargetContent("Error: Failed to create translator");
        return;
      }

      const translation = await newTranslator.translate(text);
      setTargetContent(translation);
    } catch (error) {
      console.error("Translation failed:", error);
      setTargetContent(`Translation failed: ${error}`);
    }
  };

  const swapLanguages = async () => {
    const newSrcLang = tgt_lang;
    const newTgtLang = src_lang;
    setSrcLang(newSrcLang);
    setTgtLang(newTgtLang);
    setSourceContent(targetContent);
    
    // Reinitialize the translator and translate
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
    
    // Reinitialize the translator
    await initTranslator(
      type === 'source' ? value : src_lang,
      type === 'target' ? value : tgt_lang
    );
    // If there is source text, translate immediately
    if (sourceContent) {
      translateText(sourceContent);
    }
  };

  if (activeTab !== 'translate') return null;

  return (
    <Box sx={{ fontSize: '14px', '& *': { fontSize: 'inherit' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <FormControl sx={{ width: '45%' }}>
          <InputLabel>Source Language</InputLabel>
          <Select
            value={src_lang}
            onChange={(e) => handleLanguageChange('source', e.target.value as string)}
            label="Source Language"
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="zh-Hans">Chinese</MenuItem>
          </Select>
        </FormControl>
        <IconButton onClick={swapLanguages}>
          <SwapHorizIcon />
        </IconButton>
        <FormControl sx={{ width: '45%' }}>
          <InputLabel>Target Language</InputLabel>
          <Select
            value={tgt_lang}
            onChange={(e) => handleLanguageChange('target', e.target.value as string)}
            label="Target Language"
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="zh-Hans">Chinese</MenuItem>
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
        label="Source Text"
        sx={{ marginBottom: 2 }}
      />
      <Box sx={{ marginBottom: 2, fontWeight: 'bold', textAlign: 'center' }}>Translation Result</Box>
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
          Translate
        </Button>
        <Button
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyClick}
          size="small"
        >
          Copy
        </Button>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message="Copied to clipboard"
      />
    </Box>
  );
};

export default TranslateContent;
